"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentLogById = exports.getAgentLogs = exports.matchProviders = exports.jobIntake = exports.simulateDemo = void 0;
const AgentLog_model_1 = __importDefault(require("../models/AgentLog.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const orchestrator_1 = require("../agents/orchestrator");
// ─── Demo Scenario (Section 14) ───────────────────────────────────────────────
const DEMO_RAW_MESSAGE = "AC bilkul kaam nahi kar raha, G-13 mein kal subah chahiye, budget tight hai";
const DEMO_LOCATION = [72.9774, 33.6844];
const DEMO_CLIENT_EMAIL = "client@mahir.demo";
// ─── Controllers ──────────────────────────────────────────────────────────────
/**
 * POST /api/agent/simulate
 * Auth-free hackathon demo endpoint (§14).
 */
exports.simulateDemo = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    const demoClient = await User_model_1.default.findOne({ email: DEMO_CLIENT_EMAIL }).lean();
    if (!demoClient) {
        throw new error_middleware_1.ApiError(503, "Demo client not found — run `npm run seed` first to populate the database");
    }
    const clientId = demoClient._id.toString();
    console.log("🎬  [Demo] Starting Section 14 simulation...");
    console.log(`    Message  : "${DEMO_RAW_MESSAGE}"`);
    console.log(`    Client   : ${demoClient.name} (${clientId})`);
    console.log(`    Location : lng=${DEMO_LOCATION[0]}, lat=${DEMO_LOCATION[1]} (G-13 Islamabad)`);
    const startMs = Date.now();
    const result = await orchestrator_1.orchestrator.processClientRequest(DEMO_RAW_MESSAGE, clientId, DEMO_LOCATION);
    const totalMs = Date.now() - startMs;
    console.log(`✅  [Demo] Pipeline completed in ${totalMs}ms`);
    console.log(`    SessionId : ${result.sessionId}`);
    console.log(`    Matches   : ${result.matchmakerOutput.matches.length}`);
    res.status(200).json({
        success: true,
        demo: true,
        meta: {
            scenario: "Section 14 — Mahir Master Architecture",
            rawMessage: DEMO_RAW_MESSAGE,
            clientName: demoClient.name,
            clientLocation: { lng: DEMO_LOCATION[0], lat: DEMO_LOCATION[1], area: "G-13, Islamabad" },
            pipelineTotalMs: totalMs,
        },
        data: {
            sessionId: result.sessionId,
            jobPostId: result.jobPostId,
            parsedIntent: result.parserOutput,
            matches: result.matchmakerOutput.matches,
            totalSearched: result.matchmakerOutput.totalSearched,
            searchRadiusKm: result.matchmakerOutput.searchRadiusKm,
            fallback: result.matchmakerOutput.fallback,
            matchReasoning: result.matchmakerOutput.reasoning,
        },
    });
});
/**
 * POST /api/agent/job-intake
 * Full AI pipeline entry point (authenticated).
 * Body: { rawMessage, latitude, longitude }
 */
exports.jobIntake = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    if (!clientId)
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    const { rawMessage, latitude, longitude } = req.body;
    if (!rawMessage || typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
        throw new error_middleware_1.ApiError(400, "rawMessage (string) is required");
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new error_middleware_1.ApiError(400, "latitude and longitude (numbers) are required");
    }
    const result = await orchestrator_1.orchestrator.processClientRequest(rawMessage.trim(), clientId, [longitude, latitude]);
    res.status(201).json({
        success: true,
        data: {
            sessionId: result.sessionId,
            jobPostId: result.jobPostId,
            parsedIntent: result.parserOutput,
            matches: result.matchmakerOutput.matches,
            totalSearched: result.matchmakerOutput.totalSearched,
            searchRadiusKm: result.matchmakerOutput.searchRadiusKm,
            fallback: result.matchmakerOutput.fallback,
            matchReasoning: result.matchmakerOutput.reasoning,
        },
    });
});
/**
 * POST /api/agent/match
 * Manually triggers provider selection + Quoter for an existing session.
 * Body: { sessionId, jobPostId, providerId }
 */
exports.matchProviders = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    if (!clientId)
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    const { sessionId, jobPostId, providerId } = req.body;
    if (!sessionId || !jobPostId || !providerId) {
        throw new error_middleware_1.ApiError(400, "sessionId, jobPostId, and providerId are required");
    }
    const result = await orchestrator_1.orchestrator.processProviderSelection(sessionId, jobPostId, providerId, clientId);
    res.status(201).json({
        success: true,
        data: {
            bookingId: result.bookingId,
            pricing: result.quoterOutput.pricing,
            bookingSlot: result.quoterOutput.bookingSlot,
            confirmation: result.quoterOutput.confirmation,
            simulatedSMS: result.quoterOutput.simulatedSMS,
            followUpSchedule: result.quoterOutput.followUpSchedule,
            reasoning: result.quoterOutput.reasoning,
        },
    });
});
/**
 * GET /api/agent/logs
 * Returns recent AgentLog entries for hackathon judge inspection.
 * Query params: ?limit=20&page=1&fallbackOnly=false
 */
exports.getAgentLogs = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { limit = "20", page = "1", fallbackOnly = "false", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (fallbackOnly === "true")
        filter["fallbackTriggered"] = true;
    const [logs, total] = await Promise.all([
        AgentLog_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        AgentLog_model_1.default.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
        },
        data: logs,
    });
});
/**
 * GET /api/agent/logs/:id (§8)
 * Returns a single session detail by sessionId.
 */
exports.getAgentLogById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const log = await AgentLog_model_1.default.findOne({ sessionId: id }).lean();
    if (!log) {
        throw new error_middleware_1.ApiError(404, `Agent log not found for sessionId: ${id}`);
    }
    res.status(200).json({ success: true, data: log });
});
//# sourceMappingURL=agent.controller.js.map