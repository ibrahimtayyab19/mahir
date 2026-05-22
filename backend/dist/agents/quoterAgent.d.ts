import { ParserOutput } from "./parserAgent";
import { ProviderMatch } from "./matchmakerAgent";
/** Itemised pricing breakdown in PKR. */
export interface QuoterPricing {
    baseFee: number;
    distanceCharge: number;
    urgencySurge: number;
    peakHourCharge: number;
    total: number;
    currency: "PKR";
    breakdown: string;
}
/** Bilingual confirmation messages (§6 exact shape). */
export interface QuoterConfirmation {
    toClient: {
        english: string;
        romanUrdu: string;
    };
    toProvider: {
        english: string;
        romanUrdu: string;
    };
}
/** Post-job follow-up schedule. */
export interface QuoterFollowUp {
    reminderAt: string;
    checkInAt: string;
    feedbackRequestAt: string;
}
/** Full output from the Quoter Agent (§6 exact shape). */
export interface QuoterOutput {
    pricing: QuoterPricing;
    bookingSlot: string;
    confirmation: QuoterConfirmation;
    simulatedSMS: string;
    followUpSchedule: QuoterFollowUp;
    reasoning: string;
}
/**
 * Runs the Quoter Agent using OpenRouter.
 */
export declare function run(parsedIntent: ParserOutput, topMatch: ProviderMatch, providerPrice: number, nowIso?: string): Promise<QuoterOutput>;
/** The system prompt used — exported so the Orchestrator can log it. */
export declare const SYSTEM_PROMPT = "You are a pricing and dispatch agent for a Pakistani service marketplace (Mahir).\nYou calculate fair, transparent pricing and generate booking confirmations.\n\nPRICING RULES:\n- Base fee: provider's pricePerHour value\n- Distance charge: PKR 70 per km beyond 1km\n- Urgency surge: 0% (low), 15% (medium), 25% (high)\n- Peak hours (9am-12pm, 5pm-8pm): additional 10%\n- Always explain every rupee to the client\n- total = baseFee + distanceCharge + urgencySurge + peakHourCharge\n\nBOOKING SLOT RULES:\n- If urgency is \"high\" \u2192 suggest within 2 hours from now.\n- If urgency is \"medium\" and preferredTime exists \u2192 use it; otherwise suggest next morning (9 AM).\n- If urgency is \"low\" \u2192 suggest next available weekday slot (9 AM next business day).\n- Express the booking slot as a human-readable string like \"Tomorrow, 9:00 AM \u2013 11:00 AM\".\n\nDISPATCH RULES:\n- Generate confirmation in both English and Roman Urdu\n- Provide separate messages for client and provider\n- Simulate SMS format: start with \"MAHIR:\"\n- Never share client phone number in provider message\n\nRULES:\n- You MUST respond with ONLY a valid JSON object.\n- DO NOT include markdown code blocks (e.g., no ```json ... ```).\n- DO NOT include any preamble, explanation, or postamble.\n- Output MUST be pure, raw JSON.\n\nOUTPUT FORMAT (strict):\n{\n  \"pricing\": {\n    \"baseFee\": number,\n    \"distanceCharge\": number,\n    \"urgencySurge\": number,\n    \"peakHourCharge\": number,\n    \"total\": number,\n    \"currency\": \"PKR\",\n    \"breakdown\": string\n  },\n  \"bookingSlot\": string,\n  \"confirmation\": {\n    \"toClient\": { \"english\": string, \"romanUrdu\": string },\n    \"toProvider\": { \"english\": string, \"romanUrdu\": string }\n  },\n  \"simulatedSMS\": string,\n  \"followUpSchedule\": {\n    \"reminderAt\": string,\n    \"checkInAt\": string,\n    \"feedbackRequestAt\": string\n  },\n  \"reasoning\": string\n}";
//# sourceMappingURL=quoterAgent.d.ts.map