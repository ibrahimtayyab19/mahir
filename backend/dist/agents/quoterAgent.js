"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.run = run;
const openai_1 = __importDefault(require("openai"));
const error_middleware_1 = require("../middleware/error.middleware");
// ─── System Prompt (§6 Agent 3 — exact pricing rules) ───────────────────────
const QUOTER_SYSTEM_PROMPT = `You are a pricing and dispatch agent for a Pakistani service marketplace (Mahir).
You calculate fair, transparent pricing and generate booking confirmations.

PRICING RULES:
- Base fee: provider's pricePerHour value
- Distance charge: PKR 70 per km beyond 1km
- Urgency surge: 0% (low), 15% (medium), 25% (high)
- Peak hours (9am-12pm, 5pm-8pm): additional 10%
- Always explain every rupee to the client
- total = baseFee + distanceCharge + urgencySurge + peakHourCharge

BOOKING SLOT RULES:
- If urgency is "high" → suggest within 2 hours from now.
- If urgency is "medium" and preferredTime exists → use it; otherwise suggest next morning (9 AM).
- If urgency is "low" → suggest next available weekday slot (9 AM next business day).
- Express the booking slot as a human-readable string like "Tomorrow, 9:00 AM – 11:00 AM".

DISPATCH RULES:
- Generate confirmation in both English and Roman Urdu
- Provide separate messages for client and provider
- Simulate SMS format: start with "MAHIR:"
- Never share client phone number in provider message

RULES:
- You MUST respond with ONLY a valid JSON object.
- DO NOT include markdown code blocks (e.g., no \`\`\`json ... \`\`\`).
- DO NOT include any preamble, explanation, or postamble.
- Output MUST be pure, raw JSON.

OUTPUT FORMAT (strict):
{
  "pricing": {
    "baseFee": number,
    "distanceCharge": number,
    "urgencySurge": number,
    "peakHourCharge": number,
    "total": number,
    "currency": "PKR",
    "breakdown": string
  },
  "bookingSlot": string,
  "confirmation": {
    "toClient": { "english": string, "romanUrdu": string },
    "toProvider": { "english": string, "romanUrdu": string }
  },
  "simulatedSMS": string,
  "followUpSchedule": {
    "reminderAt": string,
    "checkInAt": string,
    "feedbackRequestAt": string
  },
  "reasoning": string
}`;
// ─── Agent Executor ───────────────────────────────────────────────────────────
/**
 * Runs the Quoter Agent using OpenRouter.
 */
async function run(parsedIntent, topMatch, providerPrice, nowIso = new Date().toISOString()) {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
        throw new error_middleware_1.ApiError(500, "GROQ_API_KEY is not set in environment");
    }
    const userMessage = JSON.stringify({
        parsedIntent,
        topMatch: {
            providerId: topMatch.providerId,
            providerName: topMatch.name,
            matchScore: topMatch.score,
            distanceKm: topMatch.distanceKm,
            reasoning: topMatch.reasoning,
        },
        providerPricePerHour: providerPrice,
        currentTimestamp: nowIso,
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
                { role: "system", content: QUOTER_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });
        const raw = completion.choices[0]?.message?.content ?? "";
        rawJson = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (!rawJson.startsWith("{")) {
            throw new Error(`Invalid JSON start: ${rawJson.slice(0, 20)}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new error_middleware_1.ApiError(502, `Quoter LLM Connection Error: ${message}`);
    }
    try {
        const parsed = JSON.parse(rawJson);
        if (!isQuoterOutput(parsed)) {
            throw new Error("Schema mismatch");
        }
        return parsed;
    }
    catch (err) {
        console.error(`[QuoterAgent] JSON Parse Failure. Raw: ${rawJson}`);
        throw new error_middleware_1.ApiError(502, `Quoter Agent failed to parse LLM response.`);
    }
}
// ─── Runtime Type Guards ──────────────────────────────────────────────────────
function isQuoterPricing(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const p = v;
    return (typeof p["baseFee"] === "number" &&
        typeof p["distanceCharge"] === "number" &&
        typeof p["urgencySurge"] === "number" &&
        typeof p["peakHourCharge"] === "number" &&
        typeof p["total"] === "number" &&
        typeof p["breakdown"] === "string");
}
function isConfirmation(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const c = v;
    const tc = c["toClient"];
    if (typeof tc !== "object" || tc === null)
        return false;
    const tcr = tc;
    if (typeof tcr["english"] !== "string" || typeof tcr["romanUrdu"] !== "string")
        return false;
    const tp = c["toProvider"];
    if (typeof tp !== "object" || tp === null)
        return false;
    const tpr = tp;
    if (typeof tpr["english"] !== "string" || typeof tpr["romanUrdu"] !== "string")
        return false;
    return true;
}
function isFollowUp(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const f = v;
    return (typeof f["reminderAt"] === "string" &&
        typeof f["checkInAt"] === "string" &&
        typeof f["feedbackRequestAt"] === "string");
}
function isQuoterOutput(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value;
    return (isQuoterPricing(v["pricing"]) &&
        typeof v["bookingSlot"] === "string" &&
        isConfirmation(v["confirmation"]) &&
        typeof v["simulatedSMS"] === "string" &&
        isFollowUp(v["followUpSchedule"]) &&
        typeof v["reasoning"] === "string");
}
/** The system prompt used — exported so the Orchestrator can log it. */
exports.SYSTEM_PROMPT = QUOTER_SYSTEM_PROMPT;
//# sourceMappingURL=quoterAgent.js.map