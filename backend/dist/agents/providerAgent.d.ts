export interface ProviderAgentOutput {
    /** The conversational reply to send back to the provider */
    replyText: string;
    /** Action indicating what the frontend should fetch */
    action: "fetch_jobs" | "fetch_earnings" | "none";
    /** If the provider specifically asks for a type of job (e.g. Carpenter), extract it */
    requestedCategory?: string;
}
export declare function run(rawInput: string, providerCategory: string): Promise<ProviderAgentOutput>;
//# sourceMappingURL=providerAgent.d.ts.map