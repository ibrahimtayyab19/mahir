"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrator = exports.MahirOrchestrator = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const parserAgent = __importStar(require("./parserAgent"));
const matchmakerAgent = __importStar(require("./matchmakerAgent"));
const quoterAgent = __importStar(require("./quoterAgent"));
const Provider_model_1 = __importDefault(require("../models/Provider.model"));
const JobPost_model_1 = __importDefault(require("../models/JobPost.model"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const AgentLog_model_1 = __importDefault(require("../models/AgentLog.model"));
const error_middleware_1 = require("../middleware/error.middleware");
// ─── Geo Query Constants ──────────────────────────────────────────────────────
const DEFAULT_RADIUS_M = 10000; // 10 km
const FALLBACK_RADIUS_M = 25000; // 25 km — used when < 3 providers found nearby
// ─── Orchestrator Class ───────────────────────────────────────────────────────
class MahirOrchestrator {
    // ── processClientRequest ───────────────────────────────────────────────────
    /**
     * Full agentic pipeline triggered by a new client job request.
     *
     * Flow: Parser → MongoDB $geoNear → Matchmaker → Save JobPost → Emit events → Log trace
     */
    async processClientRequest(rawMessage, clientId, clientLocation) {
        const sessionId = (0, crypto_1.randomUUID)();
        const orchestratorPlan = "1. Parse → 2. Query DB → 3. Match → 4. Price";
        const agentTraces = [];
        try {
            let fallbackTriggered = false;
            let fallbackReason = null;
            // ── Step 1: Parser Agent ───────────────────────────────────────────────
            const parserStart = Date.now();
            const parsedIntent = await parserAgent.run(rawMessage);
            const parserLatency = Date.now() - parserStart;
            console.log(`\n[AGENT LOG] 🤖 Parser Reasoning: ${parsedIntent.reasoning}`);
            console.log(`[AGENT LOG] 📍 Intent: ${parsedIntent.serviceType} in ${parsedIntent.location.area}`);
            agentTraces.push({
                name: "Parser",
                input: { rawMessage },
                systemPrompt: parserAgent.SYSTEM_PROMPT,
                reasoning: parsedIntent.reasoning,
                toolsCalled: [],
                output: parsedIntent,
                latencyMs: parserLatency,
                inputTokens: 0,
                outputTokens: 0,
            });
            // ── Step 1.5: Clarification Check ──────────────────────────────────────
            if (parsedIntent.clarificationNeeded && parsedIntent.clarificationQuestion) {
                console.log(`[AGENT LOG] ⚠️ Clarification needed: ${parsedIntent.clarificationQuestion}`);
                await AgentLog_model_1.default.create({
                    sessionId,
                    orchestratorPlan,
                    agents: agentTraces,
                    totalLatencyMs: parserLatency,
                    fallbackTriggered: true,
                    fallbackReason: "Clarification Needed",
                    finalOutcome: "Waiting for user clarification",
                });
                return {
                    sessionId,
                    jobPostId: null,
                    parserOutput: parsedIntent,
                    matchmakerOutput: {
                        matches: [],
                        totalSearched: 0,
                        searchRadiusKm: 0,
                        fallback: {
                            reason: parsedIntent.clarificationQuestion,
                            suggestion: "Please reply with more details so I can find the best person for the job.",
                        },
                        reasoning: "Clarification required from client.",
                    },
                    jobPost: null,
                    agentTraces,
                };
            }
            // ── Step 2: MongoDB $geoNear — find nearby active providers ───────────
            let providers = await this._queryNearbyProviders(clientLocation, parsedIntent.serviceType, DEFAULT_RADIUS_M);
            console.log(`[AGENT LOG] 🔎 Found ${providers.length} providers within 10km`);
            if (providers.length < 3) {
                fallbackTriggered = true;
                fallbackReason = `Only ${providers.length} provider(s) within 10 km — expanding to 25 km`;
                providers = await this._queryNearbyProviders(clientLocation, parsedIntent.serviceType, FALLBACK_RADIUS_M);
                console.log(`[AGENT LOG] ⚠️  Fallback: ${fallbackReason}`);
            }
            // ── Step 3: Matchmaker Agent ──────────────────────────────────────────
            let matchmakerOutput;
            if (providers.length === 0) {
                fallbackTriggered = true;
                fallbackReason = "No active providers found within 25 km";
                matchmakerOutput = {
                    matches: [],
                    totalSearched: 0,
                    searchRadiusKm: 25,
                    fallback: {
                        reason: "Koi bhi provider abhi available nahi hai aapke area mein.",
                        suggestion: "Thori der baad dobara try karein ya apna area change karein.",
                    },
                    reasoning: fallbackReason,
                };
                console.log(`[AGENT LOG] ❌ No providers found.`);
            }
            else {
                const matchStart = Date.now();
                matchmakerOutput = await matchmakerAgent.run(parsedIntent, providers);
                const matchLatency = Date.now() - matchStart;
                console.log(`[AGENT LOG] 🤖 Matchmaker Reasoning: ${matchmakerOutput.reasoning}`);
                matchmakerOutput.matches.forEach((m, i) => {
                    console.log(`[AGENT LOG] 🏆 Match #${i + 1}: ${m.name} (Score: ${m.score.toFixed(1)})`);
                });
                agentTraces.push({
                    name: "Matchmaker",
                    input: {
                        intent: parsedIntent,
                        providerCount: providers.length,
                    },
                    systemPrompt: matchmakerAgent.SYSTEM_PROMPT,
                    reasoning: matchmakerOutput.reasoning,
                    toolsCalled: [],
                    output: matchmakerOutput,
                    latencyMs: matchLatency,
                    inputTokens: 0,
                    outputTokens: 0,
                });
            }
            // ── Step 4: Save JobPost ───────────────────────────────────────────────
            const matchedIds = matchmakerOutput.matches
                .slice(0, 5)
                .map((m) => {
                try {
                    return new mongoose_1.Types.ObjectId(m.providerId);
                }
                catch {
                    return null;
                }
            })
                .filter((id) => id !== null);
            let englishDesc = parsedIntent.jobPost?.english || rawMessage;
            if (!englishDesc || englishDesc.trim().length === 0)
                englishDesc = "Client requested a service.";
            let safeTitle = englishDesc.trim();
            if (safeTitle.length < 5) {
                safeTitle = (safeTitle + " Task").trim();
                if (safeTitle.length < 5)
                    safeTitle = "Service Request";
            }
            if (safeTitle.length > 110) {
                safeTitle = safeTitle.substring(0, 110) + "...";
            }
            const jobPost = await JobPost_model_1.default.create({
                clientId: new mongoose_1.Types.ObjectId(clientId),
                title: safeTitle,
                category: parsedIntent.serviceType,
                serviceType: parsedIntent.serviceType,
                rawInput: rawMessage,
                descriptionEN: englishDesc,
                descriptionUR: "",
                descriptionRU: parsedIntent.jobPost?.romanUrdu || "",
                urgency: parsedIntent.urgency || "medium",
                preferredTime: parsedIntent.preferredTime || "As soon as possible",
                description: englishDesc,
                budgetMinPKR: 0,
                budgetMaxPKR: 50000,
                location: {
                    type: "Point",
                    coordinates: clientLocation,
                },
                address: parsedIntent.location.area,
                area: parsedIntent.location.area,
                city: parsedIntent.location.city,
                status: "open",
                matchedProviderIds: matchedIds,
                aiGeneratedAt: new Date(),
            });
            // ── Step 5: Persist full AgentLog trace (hackathon audit) ─────────────
            const totalLatency = agentTraces.reduce((sum, t) => sum + t.latencyMs, 0);
            await AgentLog_model_1.default.create({
                sessionId,
                orchestratorPlan,
                agents: agentTraces,
                totalLatencyMs: totalLatency,
                fallbackTriggered,
                fallbackReason,
                finalOutcome: fallbackTriggered
                    ? `Fallback — ${fallbackReason ?? "unknown"}`
                    : `Matched ${matchmakerOutput.matches.length} provider(s) for "${parsedIntent.serviceType}"`,
            });
            return {
                sessionId,
                jobPostId: jobPost._id.toString(),
                parserOutput: parsedIntent,
                matchmakerOutput,
                jobPost,
                agentTraces,
            };
        }
        catch (err) {
            console.error(`💥  [Orchestrator] CRITICAL PIPELINE FAILURE:`, err);
            // TRILINGUAL FALLBACK RESPONSE (§11)
            const errorResponse = {
                sessionId,
                jobPostId: "failed",
                parserOutput: {
                    serviceType: "Other",
                    location: { area: "Unknown", city: "Islamabad" },
                    urgency: "medium",
                    jobPost: {
                        english: "System busy, please try again shortly.",
                        urdu: "سسٹم مصروف ہے، براہ کرم تھوڑی دیر بعد دوبارہ کوشش کریں۔",
                        romanUrdu: "System busy hai, please thori der baad dobara try karein.",
                    }
                },
                matchmakerOutput: {
                    matches: [],
                    fallback: {
                        reason: "Technical difficulty in our agent brain.",
                        suggestion: "Please try again in a few minutes."
                    },
                    reasoning: "Pipeline crashed. Emergency fallback triggered."
                },
                agentTraces: agentTraces.length > 0 ? agentTraces : [{ name: "Orchestrator", reasoning: "Crash prevented." }],
                isFallback: true
            };
            return errorResponse;
        }
    }
    // ── processProviderSelection ───────────────────────────────────────────────
    /**
     * Step 6: Quoter Agent (sequential orchestration continues)
     */
    async processProviderSelection(sessionId, jobPostId, providerId, clientId) {
        // ── Fetch documents ────────────────────────────────────────────────────
        const [jobPost, provider] = await Promise.all([
            JobPost_model_1.default.findById(jobPostId).lean(),
            Provider_model_1.default.findById(providerId).populate("userId", "name").lean(),
        ]);
        if (!jobPost)
            throw new error_middleware_1.ApiError(404, "JobPost not found");
        if (!provider)
            throw new error_middleware_1.ApiError(404, "Provider not found");
        const providerName = provider.userId?.name ?? "Provider";
        // Reconstruct ParserOutput for Quoter context
        const reconstructedIntent = {
            serviceType: jobPost.serviceType || jobPost.category,
            location: { area: jobPost.area ?? "", city: jobPost.city },
            urgency: jobPost.urgency,
            preferredTime: jobPost.preferredTime ?? "",
            budgetSensitivity: "moderate",
            confidence: 1.0,
            clarificationNeeded: false,
            clarificationQuestion: null,
            jobPost: {
                english: jobPost.descriptionEN ?? jobPost.title,
                romanUrdu: jobPost.descriptionRU ?? "",
            },
            reasoning: "Sequential orchestration: Quoter running after provider selection.",
        };
        const topMatch = {
            providerId: provider._id.toString(),
            name: providerName,
            score: 100,
            distanceKm: 0, // Distance already accounted for in matching phase
            estimatedArrivalMins: 15,
            rating: provider.rating,
            priceEstimate: provider.pricePerHour,
            verifiedBadge: provider.verifiedBadge,
            reasoning: "Selected by client.",
            matchFactors: {
                distance: 1, rating: 1, onTime: 1, specialization: 1, cancellationRate: 1, sentiment: 1
            },
        };
        // ── Step 6: Quoter Agent ───────────────────────────────────────────────
        const quoterStart = Date.now();
        const quoterOutput = await quoterAgent.run(reconstructedIntent, topMatch, provider.pricePerHour, new Date().toISOString());
        const quoterLatency = Date.now() - quoterStart;
        const pricing = quoterOutput.pricing;
        // ── Create Booking ─────────────────────────────────────────────────────
        const booking = await Booking_model_1.default.create({
            jobPostId: new mongoose_1.Types.ObjectId(jobPostId),
            clientId: new mongoose_1.Types.ObjectId(clientId),
            providerId: new mongoose_1.Types.ObjectId(providerId),
            serviceType: jobPost.serviceType || jobPost.category,
            scheduledTime: new Date(),
            pricing: {
                baseFee: pricing.baseFee,
                distanceCharge: pricing.distanceCharge,
                urgencySurge: pricing.urgencySurge,
                peakHourCharge: pricing.peakHourCharge,
                totalEstimate: pricing.total,
                currency: "PKR",
            },
            agentSessionId: sessionId,
            status: "pending",
            statusHistory: [{ status: "pending", timestamp: new Date() }],
        });
        await JobPost_model_1.default.findByIdAndUpdate(jobPostId, {
            status: "matched",
            assignedProviderId: new mongoose_1.Types.ObjectId(providerId),
        });
        // ── Append Quoter trace to AgentLog ──────────────────────────────────
        const quoterTrace = {
            name: "Quoter",
            input: { jobPostId, providerId },
            systemPrompt: quoterAgent.SYSTEM_PROMPT,
            reasoning: quoterOutput.reasoning,
            toolsCalled: [],
            output: quoterOutput,
            latencyMs: quoterLatency,
            inputTokens: 0,
            outputTokens: 0,
        };
        const updated = await AgentLog_model_1.default.findOneAndUpdate({ sessionId }, {
            $push: { agents: quoterTrace },
            $inc: { totalLatencyMs: quoterLatency },
            $set: { finalOutcome: `Booking ${booking._id} created. Total PKR ${pricing.total}` }
        });
        if (!updated) {
            await AgentLog_model_1.default.create({
                sessionId,
                orchestratorPlan: "Provider Selection → Quoter → Booking Creation",
                agents: [quoterTrace],
                totalLatencyMs: quoterLatency,
                fallbackTriggered: false,
                fallbackReason: null,
                finalOutcome: `Booking created (${booking._id.toString()}) — price PKR ${pricing.total}`,
            });
        }
        return {
            bookingId: booking._id.toString(),
            quoterOutput,
        };
    }
    // ── Private Helpers ────────────────────────────────────────────────────────
    /**
     * Runs a $geoNear aggregation on the Provider collection.
     * Joins the User doc via $lookup to get the provider's display name.
     */
    async _queryNearbyProviders(coordinates, serviceType, maxDistanceMetres) {
        const results = await Provider_model_1.default.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates },
                    distanceField: "distanceMetres",
                    maxDistance: maxDistanceMetres,
                    query: {
                        isActive: true,
                        serviceCategory: { $regex: new RegExp(serviceType, "i") },
                    },
                    spherical: true,
                },
            },
            // Join User to get provider's display name
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDoc",
                    pipeline: [{ $project: { name: 1 } }],
                },
            },
            { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: false } },
            {
                $addFields: {
                    name: "$userDoc.name",
                    "userId._id": "$userId",
                    "userId.name": "$userDoc.name",
                },
            },
            { $project: { userDoc: 0 } },
            { $limit: 10 },
        ]);
        return results;
    }
}
exports.MahirOrchestrator = MahirOrchestrator;
// ─── Singleton Export ─────────────────────────────────────────────────────────
/** Shared orchestrator instance — import this in controllers. */
exports.orchestrator = new MahirOrchestrator();
//# sourceMappingURL=orchestrator.js.map