"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Schema ───────────────────────────────────────────────────────────────────
const AgentTraceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        enum: ["Parser", "Matchmaker", "Quoter"],
        required: true,
    },
    input: { type: mongoose_1.Schema.Types.Mixed, required: true },
    systemPrompt: { type: String, required: true },
    reasoning: { type: String, default: "" },
    toolsCalled: { type: [String], default: [] },
    output: { type: mongoose_1.Schema.Types.Mixed, required: true },
    latencyMs: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
}, { _id: false });
const AgentLogSchema = new mongoose_1.Schema({
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
}, {
    timestamps: { createdAt: true, updatedAt: false }, // logs are immutable
    versionKey: false,
});
// ─── Indexes ──────────────────────────────────────────────────────────────────
AgentLogSchema.index({ createdAt: -1 });
AgentLogSchema.index({ fallbackTriggered: 1, createdAt: -1 });
// Auto-purge logs older than 30 days
AgentLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
// ─── Export ───────────────────────────────────────────────────────────────────
const AgentLog = (0, mongoose_1.model)("AgentLog", AgentLogSchema);
exports.default = AgentLog;
//# sourceMappingURL=AgentLog.model.js.map