import { Document, Types } from "mongoose";
export type AgentName = "Parser" | "Matchmaker" | "Quoter";
export interface AgentTrace {
    name: AgentName;
    input: Record<string, unknown>;
    systemPrompt: string;
    reasoning: string;
    toolsCalled: string[];
    output: Record<string, unknown>;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
}
export interface IAgentLog {
    sessionId: string;
    orchestratorPlan: string;
    agents: AgentTrace[];
    totalLatencyMs: number;
    fallbackTriggered: boolean;
    fallbackReason: string | null;
    finalOutcome: string;
    createdAt?: Date;
}
export interface IAgentLogDocument extends IAgentLog, Document {
    _id: Types.ObjectId;
}
declare const AgentLog: import("mongoose").Model<IAgentLogDocument, {}, {}, {}, Document<unknown, {}, IAgentLogDocument, {}, {}> & IAgentLogDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default AgentLog;
//# sourceMappingURL=AgentLog.model.d.ts.map