import OpenAI from "openai";
import { ApiError } from "../middleware/error.middleware";

// ─── Output Interface (§6 Agent 1 — exact schema) ────────────────────────────

export interface ParserOutput {
  /** Canonical English service type (e.g. "AC Technician", "Plumber") */
  serviceType: string;
  /** Extracted location with area and city split */
  location: { area: string; city: string };
  /** Job urgency level */
  urgency: "low" | "medium" | "high";
  /** Preferred time slot, ISO-8601 or natural language */
  preferredTime: string;
  /** How price-sensitive the client is (§6 exact enum) */
  budgetSensitivity: "flexible" | "moderate" | "price-conscious";
  /** Parser confidence 0.0–1.0 */
  confidence: number;
  /** Whether a clarification question should be asked */
  clarificationNeeded: boolean;
  /** The clarification question (null if not needed) */
  clarificationQuestion: string | null;
  /** Bilingual job post descriptions */
  jobPost: {
    english: string;
    romanUrdu: string;
  };
  /** Step-by-step chain-of-thought reasoning (for audit log) */
  reasoning: string;
}

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
export async function run(rawInput: string): Promise<ParserOutput> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new ApiError(500, "GROQ_API_KEY is not set in environment");
  }

  const client = new OpenAI({
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(502, `Parser LLM Connection Error: ${message}`);
  }

  try {
    const parsed = JSON.parse(rawJson);

    // LLM might return null for fields if intent is completely unknown (e.g. "Hello").
    // We sanitize these to default strings to pass the strict type guard.
    if (parsed.serviceType === null) parsed.serviceType = "Other";
    if (parsed.preferredTime === null) parsed.preferredTime = "Not specified";
    if (parsed.location) {
      if (parsed.location.area === null) parsed.location.area = "Unknown";
      if (parsed.location.city === null) parsed.location.city = "Unknown";
    }
    if (parsed.jobPost) {
      if (parsed.jobPost.english === null) parsed.jobPost.english = "";
      if (parsed.jobPost.romanUrdu === null) parsed.jobPost.romanUrdu = "";
    }
    
    if (!isParserOutput(parsed)) {
      throw new Error("Schema mismatch");
    }
    
    return parsed;
  } catch (err: unknown) {
    console.error(`[ParserAgent] JSON Parse Failure. Raw: ${rawJson}`);
    throw new ApiError(
      502,
      `Parser Agent failed to parse LLM response. The model may have returned malformed data.`
    );
  }
}

// ─── Runtime Type Guard ───────────────────────────────────────────────────────

function isParserOutput(value: unknown): value is ParserOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  // location must be { area, city }
  const loc = v["location"];
  if (typeof loc !== "object" || loc === null) return false;
  const l = loc as Record<string, unknown>;
  if (typeof l["area"] !== "string" || typeof l["city"] !== "string") return false;

  // jobPost must be { english, romanUrdu }
  const jp = v["jobPost"];
  if (typeof jp !== "object" || jp === null) return false;
  const j = jp as Record<string, unknown>;
  if (typeof j["english"] !== "string" || typeof j["romanUrdu"] !== "string") return false;

  return (
    typeof v["serviceType"] === "string" &&
    (v["urgency"] === "low" || v["urgency"] === "medium" || v["urgency"] === "high") &&
    typeof v["preferredTime"] === "string" &&
    (v["budgetSensitivity"] === "flexible" ||
      v["budgetSensitivity"] === "moderate" ||
      v["budgetSensitivity"] === "price-conscious") &&
    typeof v["confidence"] === "number" &&
    typeof v["clarificationNeeded"] === "boolean" &&
    typeof v["reasoning"] === "string"
  );
}

/** The system prompt used — exported so the Orchestrator can log it. */
export const SYSTEM_PROMPT = PARSER_SYSTEM_PROMPT;
