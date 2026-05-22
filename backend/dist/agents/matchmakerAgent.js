"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.run = run;
const openai_1 = __importDefault(require("openai"));
const error_middleware_1 = require("../middleware/error.middleware");
// ─── System Prompt (§6 Agent 2 — exact weights) ─────────────────────────────
const MATCHMAKER_SYSTEM_PROMPT = `You are a specialized provider matching agent for a Pakistani service marketplace (Mahir).
You receive a list of active nearby providers and a client's requirements.
Your ONLY job is to rank them and explain your reasoning.

6 MATCHING FACTORS AND WEIGHTS (must sum to 1.0):
- distance:         0.25  (closer = higher score — use distanceMetres to calculate)
- rating:           0.20  (provider.rating / 5.0)
- onTimeScore:      0.20  (provider.onTimeScore / 100)
- specialization:   0.15  (1.0 if exact service match, 0.5 if related, 0 if unrelated)
- cancellationRate: 0.10  (1 - provider.cancellationRate / 100 — lower rate = better)
- reviewSentiment:  0.10  ((provider.reviewSentiment + 1) / 2 — maps -1..1 to 0..1)

COMPOSITE FORMULA:
score = (distance × 0.25) + (rating × 0.20) + (onTime × 0.20) + (specialization × 0.15) + (cancellationRate × 0.10) + (sentiment × 0.10)
Then multiply by 100 to get a 0-100 score.

DISTANCE SCORING:
- Use distanceMetres from the provider data.
- 0 m = 1.0, 5000 m = 0.5, 10000 m = 0.0 (linear interpolation).

RULES:
- You MUST respond with ONLY a valid JSON object.
- DO NOT include markdown code blocks (e.g., no \`\`\`json ... \`\`\`).
- DO NOT include any preamble, explanation, or postamble.
- Output MUST be pure, raw JSON.
- Return at most 3 matches, ranked by score descending.
- Write reasoning in simple English/Roman Urdu that a client can understand.
- Never recommend a provider with cancellationRate > 40%.
- If no providers match, set fallback to an object with "reason" and "suggestion" strings.
- Estimate arrival time based on distance: roughly 5 min per km.
- Set priceEstimate to provider's pricePerHour value.

OUTPUT FORMAT (strict):
{
  "matches": [{
    "providerId": string,
    "name": string,
    "score": number (0-100),
    "distanceKm": number,
    "estimatedArrivalMins": number,
    "rating": number,
    "priceEstimate": number,
    "verifiedBadge": boolean,
    "reasoning": string,
    "matchFactors": {
      "distance": number, "rating": number, "onTime": number,
      "specialization": number, "cancellationRate": number, "sentiment": number
    }
  }],
  "totalSearched": number,
  "searchRadiusKm": number,
  "fallback": null | { "reason": string, "suggestion": string },
  "reasoning": string
}`;
// ─── Agent Executor ───────────────────────────────────────────────────────────
/**
 * Runs the Matchmaker Agent using OpenRouter.
 */
async function run(parsedIntent, providers) {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
        throw new error_middleware_1.ApiError(500, "GROQ_API_KEY is not set in environment");
    }
    if (!parsedIntent.serviceType || parsedIntent.serviceType === "Other") {
        throw new error_middleware_1.ApiError(400, "Invalid or unrecognized service type. Cannot proceed with matchmaking.");
    }
    // ── Strip Mongoose docs to lightweight payloads ──────────────────────────
    const providerPayloads = providers.map((p, idx) => ({
        id: p._id?.toString() ?? String(idx),
        name: p.name ?? `Provider-${idx}`,
        location: {
            lat: p.location.coordinates[1],
            lng: p.location.coordinates[0],
        },
        rating: p.rating,
        onTimeScore: p.onTimeScore,
        specialization: p.serviceCategory,
        cancellationRate: p.cancellationRate,
        reviewSentiment: p.reviewSentiment,
        pricePerHour: p.pricePerHour,
        distanceMetres: p.distanceMetres,
        verifiedBadge: p.verifiedBadge,
    }));
    const userMessage = JSON.stringify({
        intent: parsedIntent,
        providers: providerPayloads,
    });
    const client = new openai_1.default({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
    });
    const modelName = "llama-3.3-70b-versatile";
    let rawJson = "";
    try {
        const completion = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: MATCHMAKER_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });
        const raw = completion.choices[0]?.message?.content ?? "";
        rawJson = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (!rawJson.startsWith("{")) {
            throw new Error(`Invalid JSON start: ${rawJson.slice(0, 20)}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new error_middleware_1.ApiError(502, `Matchmaker LLM Connection Error: ${message}`);
    }
    try {
        const parsed = JSON.parse(rawJson);
        if (!isMatchmakerOutput(parsed)) {
            throw new Error("Schema mismatch");
        }
        return parsed;
    }
    catch (err) {
        console.error(`[MatchmakerAgent] JSON Parse Failure. Raw: ${rawJson}`);
        throw new error_middleware_1.ApiError(502, `Matchmaker Agent failed to parse LLM response.`);
    }
}
// ─── Runtime Type Guards ──────────────────────────────────────────────────────
function isMatchFactors(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const f = v;
    return (typeof f["distance"] === "number" &&
        typeof f["rating"] === "number" &&
        typeof f["onTime"] === "number" &&
        typeof f["specialization"] === "number" &&
        typeof f["cancellationRate"] === "number" &&
        typeof f["sentiment"] === "number");
}
function isProviderMatch(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const m = v;
    return (typeof m["providerId"] === "string" &&
        typeof m["name"] === "string" &&
        typeof m["score"] === "number" &&
        typeof m["distanceKm"] === "number" &&
        typeof m["estimatedArrivalMins"] === "number" &&
        typeof m["rating"] === "number" &&
        typeof m["priceEstimate"] === "number" &&
        typeof m["verifiedBadge"] === "boolean" &&
        typeof m["reasoning"] === "string" &&
        isMatchFactors(m["matchFactors"]));
}
function isMatchmakerOutput(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value;
    return (Array.isArray(v["matches"]) &&
        v["matches"].every(isProviderMatch) &&
        typeof v["totalSearched"] === "number" &&
        typeof v["searchRadiusKm"] === "number" &&
        typeof v["reasoning"] === "string"
    // fallback is null | object — always valid
    );
}
/** The system prompt used — exported so the Orchestrator can log it. */
exports.SYSTEM_PROMPT = MATCHMAKER_SYSTEM_PROMPT;
//# sourceMappingURL=matchmakerAgent.js.map