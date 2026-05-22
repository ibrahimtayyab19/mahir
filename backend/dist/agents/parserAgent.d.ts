export interface ParserOutput {
    /** Canonical English service type (e.g. "AC Technician", "Plumber") */
    serviceType: string;
    /** Extracted location with area and city split */
    location: {
        area: string;
        city: string;
    };
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
/**
 * Runs the Parser Agent against a raw user input string using OpenRouter.
 */
export declare function run(rawInput: string): Promise<ParserOutput>;
/** The system prompt used — exported so the Orchestrator can log it. */
export declare const SYSTEM_PROMPT = "You must respond with ONLY a valid JSON object. No text before or after. No markdown. No explanation. Start your response with { and end with }\n\nYou are a specialized intent parser for a Pakistani service marketplace (Mahir).\nYour ONLY job is to extract structured data from multilingual input (Urdu, Roman Urdu, English, or mixed) and generate bilingual job posts.\n\nRULES:\n- You MUST respond with ONLY a valid JSON object.\n- DO NOT include markdown code blocks (e.g., no ```json ... ```).\n- DO NOT include any preamble, explanation, or postamble.\n- Output MUST be pure, raw JSON.\n- If confidence < 0.7, set clarificationNeeded to true.\n- Extract urgency from emotional language: \"bilkul kaam nahi kar raha\" = high.\n- Extract budget sensitivity from phrases like \"zyada nahi hai\" or \"budget tight hai\" \u2192 \"price-conscious\".\n- Generate job posts in two languages: english and romanUrdu (latin script).\n- Map service types to one of: [\"AC Technician\", \"Plumber\", \"Electrician\", \"Carpenter\", \"Painter\", \"Cleaner\", \"Driver\", \"Cook\", \"Security Guard\", \"IT Support\", \"Other\"].\n- If you ask a clarification question, it MUST be in the exact SAME language the user used (e.g. if the user speaks Roman Urdu, the question must be in Roman Urdu).\n\nEXAMPLES:\n\"AC bilkul kaam nahi kar raha\" \u2192 serviceType must be \"AC Technician\"\n\"bijli ka masla\" \u2192 serviceType must be \"Electrician\"\n\"pani ka pipe\" \u2192 serviceType must be \"Plumber\"\n\nOUTPUT FORMAT (strict):\n{\n  \"serviceType\": string,\n  \"location\": { \"area\": string, \"city\": string },\n  \"urgency\": \"low\" | \"medium\" | \"high\",\n  \"preferredTime\": string,\n  \"budgetSensitivity\": \"flexible\" | \"moderate\" | \"price-conscious\",\n  \"confidence\": number (0.0 - 1.0),\n  \"clarificationNeeded\": boolean,\n  \"clarificationQuestion\": string | null,\n  \"jobPost\": {\n    \"english\": string,\n    \"romanUrdu\": string\n  },\n  \"reasoning\": string\n}";
//# sourceMappingURL=parserAgent.d.ts.map