import { ParserOutput } from "./parserAgent";
import { MatchmakerOutput } from "./matchmakerAgent";
import { QuoterOutput } from "./quoterAgent";
import { IJobPostDocument } from "../models/JobPost.model";
export interface ProcessRequestResult {
    sessionId: string;
    jobPostId: string;
    parserOutput: ParserOutput;
    matchmakerOutput: MatchmakerOutput;
    jobPost: IJobPostDocument;
}
export interface ProcessSelectionResult {
    bookingId: string;
    quoterOutput: QuoterOutput;
}
export declare class MahirOrchestrator {
    /**
     * Full agentic pipeline triggered by a new client job request.
     *
     * Flow: Parser → MongoDB $geoNear → Matchmaker → Save JobPost → Emit events → Log trace
     */
    processClientRequest(rawMessage: string, clientId: string, clientLocation: [number, number]): Promise<ProcessRequestResult | any>;
    /**
     * Step 6: Quoter Agent (sequential orchestration continues)
     */
    processProviderSelection(sessionId: string, jobPostId: string, providerId: string, clientId: string): Promise<ProcessSelectionResult>;
    /**
     * Runs a $geoNear aggregation on the Provider collection.
     * Joins the User doc via $lookup to get the provider's display name.
     */
    private _queryNearbyProviders;
}
/** Shared orchestrator instance — import this in controllers. */
export declare const orchestrator: MahirOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map