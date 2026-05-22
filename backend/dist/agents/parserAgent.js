"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.run = run;
const openai_1 = __importDefault(require("openai"));
const error_middleware_1 = require("../middleware/error.middleware");
// ─── System Prompt (§6 Agent 1 — exact) ──────────────────────────────────────
const PARSER_SYSTEM_PROMPT = `You must respond with ONLY a valid JSON object. No text before or after. No markdown. No explanation. Start your response with { and end with }

You are a specialized intent parser for a Pakistani service marketplace (Mahir).
Your ONLY job is to extract structured data from multilingual input (Urdu, Roman Urdu, English, or mixed) and generate bilingual job posts.

RULES:
- You MUST respond with ONLY a valid JSON object.
- DO NOT include markdown code blocks (e.g., no \`\`\`json ... \`\`\`).
- DO NOT include any preamble, explanation, or postamble.
- Output MUST be pure, raw JSON.
- If confidence < 0.7, set clarificationNeeded to true.
- Extract urgency from emotional language: "bilkul kaam nahi kar raha" = high.
- Extract budget sensitivity from phrases like "zyada nahi hai" or "budget tight hai" → "price-conscious".
- Generate job posts in two languages: english and romanUrdu (latin script).
- Map service types to one of: ["AC Technician", "Plumber", "Electrician", "Carpenter", "Painter", "Cleaner", "Driver", "Cook", "Security Guard", "IT Support", "Other"].
- If you ask a clarification question, it MUST be in the exact SAME language the user used (e.g. if the user speaks Roman Urdu, the question must be in Roman Urdu).

EXAMPLES:
"AC bilkul kaam nahi kar raha" → serviceType must be "AC Technician"
"bijli ka masla" → serviceType must be "Electrician"
"pani ka pipe" → serviceType must be "Plumber"

OUTPUT FORMAT (strict):
{
  "serviceType": string,
  "location": { "area": string, "city": string },
  "urgency": "low" | "medium" | "high",
  "preferredTime": string,
  "budgetSensitivity": "flexible" | "moderate" | "price-conscious",
  "confidence": number (0.0 - 1.0),
  "clarificationNeeded": boolean,
  "clarificationQuestion": string | null,
  "jobPost": {
    "english": string,
    "romanUrdu": string
  },
  "reasoning": string
}`;
// ─── Agent Executor ───────────────────────────────────────────────────────────
/**
 * Runs the Parser Agent against a raw user input string using OpenRouter.
 */
async function run(rawInput) {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
        throw new error_middleware_1.ApiError(500, "GROQ_API_KEY is not set in environment");
    }
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
                { role: "system", content: PARSER_SYSTEM_PROMPT },
                { role: "user", content: rawInput },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });
        const raw = completion.choices[0]?.message?.content ?? "";
        rawJson = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        // Defensive check: If it doesn't look like JSON, throw custom error
        if (!rawJson.startsWith("{")) {
            throw new Error(`Invalid JSON start: ${rawJson.slice(0, 20)}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new error_middleware_1.ApiError(502, `Parser LLM Connection Error: ${message}`);
    }
    try {
        const parsed = JSON.parse(rawJson);
        // LLM might return null for fields if intent is completely unknown (e.g. "Hello").
        // We sanitize these to default strings to pass the strict type guard.
        if (parsed.serviceType === null)
            parsed.serviceType = "Other";
        if (parsed.preferredTime === null)
            parsed.preferredTime = "Not specified";
        if (parsed.location) {
            if (parsed.location.area === null)
                parsed.location.area = "Unknown";
            if (parsed.location.city === null)
                parsed.location.city = "Unknown";
        }
        if (parsed.jobPost) {
            if (parsed.jobPost.english === null)
                parsed.jobPost.english = "";
            if (parsed.jobPost.romanUrdu === null)
                parsed.jobPost.romanUrdu = "";
        }
        if (!isParserOutput(parsed)) {
            throw new Error("Schema mismatch");
        }
        return parsed;
    }
    catch (err) {
        console.error(`[ParserAgent] JSON Parse Failure. Raw: ${rawJson}`);
        throw new error_middleware_1.ApiError(502, `Parser Agent failed to parse LLM response. The model may have returned malformed data.`);
    }
}
// ─── Runtime Type Guard ───────────────────────────────────────────────────────
function isParserOutput(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const v = value;
    // location must be { area, city }
    const loc = v["location"];
    if (typeof loc !== "object" || loc === null)
        return false;
    const l = loc;
    if (typeof l["area"] !== "string" || typeof l["city"] !== "string")
        return false;
    // jobPost must be { english, romanUrdu }
    const jp = v["jobPost"];
    if (typeof jp !== "object" || jp === null)
        return false;
    const j = jp;
    if (typeof j["english"] !== "string" || typeof j["romanUrdu"] !== "string")
        return false;
    return (typeof v["serviceType"] === "string" &&
        (v["urgency"] === "low" || v["urgency"] === "medium" || v["urgency"] === "high") &&
        typeof v["preferredTime"] === "string" &&
        (v["budgetSensitivity"] === "flexible" ||
            v["budgetSensitivity"] === "moderate" ||
            v["budgetSensitivity"] === "price-conscious") &&
        typeof v["confidence"] === "number" &&
        typeof v["clarificationNeeded"] === "boolean" &&
        typeof v["reasoning"] === "string");
}
/** The system prompt used — exported so the Orchestrator can log it. */
exports.SYSTEM_PROMPT = PARSER_SYSTEM_PROMPT;
//# sourceMappingURL=parserAgent.js.map