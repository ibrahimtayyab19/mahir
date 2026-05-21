import { Schema, model, Document, Types } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  sessionId: string;           // UUID — links entire orchestration session
  orchestratorPlan: string;    // Human-readable plan the orchestrator decided
  agents: AgentTrace[];        // Full trace for each agent called
  totalLatencyMs: number;
  fallbackTriggered: boolean;
  fallbackReason: string | null;
  finalOutcome: string;        // Human-readable summary of what happened
  createdAt?: Date;
}

export interface IAgentLogDocument extends IAgentLog, Document {
  _id: Types.ObjectId;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AgentTraceSchema = new Schema<AgentTrace>(
  {
    name: {
      type: String,
      enum: ["Parser", "Matchmaker", "Quoter"] as AgentName[],
      required: true,
    },
    input:        { type: Schema.Types.Mixed, required: true },
    systemPrompt: { type: String, required: true },
    reasoning:    { type: String, default: "" },
    toolsCalled:  { type: [String], default: [] },
    output:       { type: Schema.Types.Mixed, required: true },
    latencyMs:    { type: Number, default: 0 },
    inputTokens:  { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const AgentLogSchema = new Schema<IAgentLogDocument>(
  {
    sessionId: {
      type: String,
      required: [true, "sessionId is required"],
      unique: true,
      index: true,
    },
    orchestratorPlan: {
      type: String,
      required: [true, "orchestratorPlan is required"],
    },
    agents: {
      type: [AgentTraceSchema],
      default: [],
    },
    totalLatencyMs: { type: Number, default: 0 },
    fallbackTriggered: { type: Boolean, default: false },
    fallbackReason: { type: String, default: null },
    finalOutcome: { type: String, required: [true, "finalOutcome is required"] },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // logs are immutable
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AgentLogSchema.index({ createdAt: -1 });
AgentLogSchema.index({ fallbackTriggered: 1, createdAt: -1 });
// Auto-purge logs older than 30 days
AgentLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ─── Export ───────────────────────────────────────────────────────────────────

const AgentLog = model<IAgentLogDocument>("AgentLog", AgentLogSchema);
export default AgentLog;
