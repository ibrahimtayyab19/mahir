import { IProvider } from "../models/Provider.model";
import { ParserOutput } from "./parserAgent";
/** Per-provider scoring factor breakdown using the exact §6 names. */
export interface MatchFactors {
    distance: number;
    rating: number;
    onTime: number;
    specialization: number;
    cancellationRate: number;
    sentiment: number;
}
/** A single ranked provider match. */
export interface ProviderMatch {
    providerId: string;
    name: string;
    score: number;
    distanceKm: number;
    estimatedArrivalMins: number;
    rating: number;
    priceEstimate: number;
    verifiedBadge: boolean;
    reasoning: string;
    matchFactors: MatchFactors;
}
/** Full output from the Matchmaker Agent (§6 exact shape). */
export interface MatchmakerOutput {
    matches: ProviderMatch[];
    totalSearched: number;
    searchRadiusKm: number;
    fallback: null | {
        reason: string;
        suggestion: string;
    };
    reasoning: string;
}
/**
 * Runs the Matchmaker Agent using OpenRouter.
 */
export declare function run(parsedIntent: ParserOutput, providers: IProvider[]): Promise<MatchmakerOutput>;
/** The system prompt used — exported so the Orchestrator can log it. */
export declare const SYSTEM_PROMPT = "You are a specialized provider matching agent for a Pakistani service marketplace (Mahir).\nYou receive a list of active nearby providers and a client's requirements.\nYour ONLY job is to rank them and explain your reasoning.\n\n6 MATCHING FACTORS AND WEIGHTS (must sum to 1.0):\n- distance:         0.25  (closer = higher score \u2014 use distanceMetres to calculate)\n- rating:           0.20  (provider.rating / 5.0)\n- onTimeScore:      0.20  (provider.onTimeScore / 100)\n- specialization:   0.15  (1.0 if exact service match, 0.5 if related, 0 if unrelated)\n- cancellationRate: 0.10  (1 - provider.cancellationRate / 100 \u2014 lower rate = better)\n- reviewSentiment:  0.10  ((provider.reviewSentiment + 1) / 2 \u2014 maps -1..1 to 0..1)\n\nCOMPOSITE FORMULA:\nscore = (distance \u00D7 0.25) + (rating \u00D7 0.20) + (onTime \u00D7 0.20) + (specialization \u00D7 0.15) + (cancellationRate \u00D7 0.10) + (sentiment \u00D7 0.10)\nThen multiply by 100 to get a 0-100 score.\n\nDISTANCE SCORING:\n- Use distanceMetres from the provider data.\n- 0 m = 1.0, 5000 m = 0.5, 10000 m = 0.0 (linear interpolation).\n\nRULES:\n- You MUST respond with ONLY a valid JSON object.\n- DO NOT include markdown code blocks (e.g., no ```json ... ```).\n- DO NOT include any preamble, explanation, or postamble.\n- Output MUST be pure, raw JSON.\n- Return at most 3 matches, ranked by score descending.\n- Write reasoning in simple English/Roman Urdu that a client can understand.\n- Never recommend a provider with cancellationRate > 40%.\n- If no providers match, set fallback to an object with \"reason\" and \"suggestion\" strings.\n- Estimate arrival time based on distance: roughly 5 min per km.\n- Set priceEstimate to provider's pricePerHour value.\n\nOUTPUT FORMAT (strict):\n{\n  \"matches\": [{\n    \"providerId\": string,\n    \"name\": string,\n    \"score\": number (0-100),\n    \"distanceKm\": number,\n    \"estimatedArrivalMins\": number,\n    \"rating\": number,\n    \"priceEstimate\": number,\n    \"verifiedBadge\": boolean,\n    \"reasoning\": string,\n    \"matchFactors\": {\n      \"distance\": number, \"rating\": number, \"onTime\": number,\n      \"specialization\": number, \"cancellationRate\": number, \"sentiment\": number\n    }\n  }],\n  \"totalSearched\": number,\n  \"searchRadiusKm\": number,\n  \"fallback\": null | { \"reason\": string, \"suggestion\": string },\n  \"reasoning\": string\n}";
//# sourceMappingURL=matchmakerAgent.d.ts.map