import { randomUUID } from "crypto";
import { Types } from "mongoose";

import * as parserAgent from "./parserAgent";
import * as matchmakerAgent from "./matchmakerAgent";
import * as quoterAgent from "./quoterAgent";
import { ParserOutput } from "./parserAgent";
import { MatchmakerOutput } from "./matchmakerAgent";
import { QuoterOutput } from "./quoterAgent";

import Provider, { IProviderDocument } from "../models/Provider.model";
import JobPost, { IJobPostDocument } from "../models/JobPost.model";
import Booking from "../models/Booking.model";
import AgentLog, { AgentTrace } from "../models/AgentLog.model";
import { ApiError } from "../middleware/error.middleware";

// ─── Geo Query Constants ──────────────────────────────────────────────────────

const DEFAULT_RADIUS_M = 10_000; // 10 km
const FALLBACK_RADIUS_M = 25_000; // 25 km — used when < 3 providers found nearby

// ─── Result Types ─────────────────────────────────────────────────────────────

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

// ─── Inline type for $geoNear pipeline results ────────────────────────────────

interface GeoNearProviderDoc {
  _id: Types.ObjectId;
  userId: { _id: Types.ObjectId; name: string };
  location: { type: "Point"; coordinates: [number, number] };
  rating: number;
  onTimeScore: number;
  serviceCategory: string;
  cancellationRate: number;
  reviewSentiment: number;
  pricePerHour: number;
  isActive: boolean;
  totalReviews: number;
  completionRate: number;
  responseTimeMinutes: number;
  totalJobsCompleted: number;
  totalEarningsPKR: number;
  walletBalance: number;
  cnicVerified: boolean;
  backgroundCheckPassed: boolean;
  verifiedBadge: boolean;
  portfolioPhotos: string[];
  experienceYears: number;
  skills: string[];
  distanceMetres: number;
}

// ─── Orchestrator Class ───────────────────────────────────────────────────────

export class MahirOrchestrator {
  // ── processClientRequest ───────────────────────────────────────────────────

  /**
   * Full agentic pipeline triggered by a new client job request.
   *
   * Flow: Parser → MongoDB $geoNear → Matchmaker → Save JobPost → Emit events → Log trace
   */
  async processClientRequest(
    rawMessage: string,
    clientId: string,
    clientLocation: [number, number]
  ): Promise<ProcessRequestResult | any> {
    const sessionId = randomUUID();
    const orchestratorPlan = "1. Parse → 2. Query DB → 3. Match → 4. Price";
    const agentTraces: AgentTrace[] = [];

    try {
      let fallbackTriggered = false;
      let fallbackReason: string | null = null;

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
        output: parsedIntent as unknown as Record<string, unknown>,
        latencyMs: parserLatency,
        inputTokens: 0,
        outputTokens: 0,
      });

      // ── Step 2: MongoDB $geoNear — find nearby active providers ───────────
      let providers = await this._queryNearbyProviders(
        clientLocation,
        parsedIntent.serviceType,
        DEFAULT_RADIUS_M
      );

      console.log(`[AGENT LOG] 🔎 Found ${providers.length} providers within 10km`);

      if (providers.length < 3) {
        fallbackTriggered = true;
        fallbackReason = `Only ${providers.length} provider(s) within 10 km — expanding to 25 km`;
        providers = await this._queryNearbyProviders(
          clientLocation,
          parsedIntent.serviceType,
          FALLBACK_RADIUS_M
        );
        console.log(`[AGENT LOG] ⚠️  Fallback: ${fallbackReason}`);
      }

      // ── Step 3: Matchmaker Agent ──────────────────────────────────────────
      let matchmakerOutput: MatchmakerOutput;

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
      } else {
        const matchStart = Date.now();
        matchmakerOutput = await matchmakerAgent.run(
          parsedIntent,
          providers as unknown as IProviderDocument[]
        );
        const matchLatency = Date.now() - matchStart;

        console.log(`[AGENT LOG] 🤖 Matchmaker Reasoning: ${matchmakerOutput.reasoning}`);
        matchmakerOutput.matches.forEach((m, i) => {
          console.log(`[AGENT LOG] 🏆 Match #${i+1}: ${m.name} (Score: ${m.score.toFixed(1)})`);
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
          output: matchmakerOutput as unknown as Record<string, unknown>,
          latencyMs: matchLatency,
          inputTokens: 0,
          outputTokens: 0,
        });
      }

      // ── Step 4: Save JobPost ───────────────────────────────────────────────
      const matchedIds = matchmakerOutput.matches
        .slice(0, 5)
        .map((m) => {
          try { return new Types.ObjectId(m.providerId); }
          catch { return null; }
        })
        .filter((id): id is Types.ObjectId => id !== null);

      const safeTitle = parsedIntent.jobPost.english.length > 110 
        ? parsedIntent.jobPost.english.substring(0, 110) + "..." 
        : parsedIntent.jobPost.english;

      const jobPost = await JobPost.create({
        clientId: new Types.ObjectId(clientId),
        title: safeTitle,
        category: parsedIntent.serviceType,
        serviceType: parsedIntent.serviceType,
        rawInput: rawMessage,
        descriptionEN: parsedIntent.jobPost.english,
        descriptionUR: "",
        descriptionRU: parsedIntent.jobPost.romanUrdu,
        urgency: parsedIntent.urgency,
        preferredTime: parsedIntent.preferredTime,
        description: parsedIntent.jobPost.english,
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
      await AgentLog.create({
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
    } catch (err) {
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
  async processProviderSelection(
    sessionId: string,
    jobPostId: string,
    providerId: string,
    clientId: string
  ): Promise<ProcessSelectionResult> {
    // ── Fetch documents ────────────────────────────────────────────────────
    const [jobPost, provider] = await Promise.all([
      JobPost.findById(jobPostId).lean(),
      Provider.findById(providerId).populate("userId", "name").lean(),
    ]);

    if (!jobPost) throw new ApiError(404, "JobPost not found");
    if (!provider) throw new ApiError(404, "Provider not found");

    const providerName = (provider.userId as unknown as { name?: string })?.name ?? "Provider";

    // Reconstruct ParserOutput for Quoter context
    const reconstructedIntent: ParserOutput = {
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
        urdu: jobPost.descriptionUR ?? "",
        romanUrdu: jobPost.descriptionRU ?? "",
      },
      reasoning: "Sequential orchestration: Quoter running after provider selection.",
    };

    const topMatch: matchmakerAgent.ProviderMatch = {
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
    const quoterOutput = await quoterAgent.run(
      reconstructedIntent,
      topMatch,
      provider.pricePerHour,
      new Date().toISOString()
    );
    const quoterLatency = Date.now() - quoterStart;

    const pricing = quoterOutput.pricing;

    // ── Create Booking ─────────────────────────────────────────────────────
    const booking = await Booking.create({
      jobPostId: new Types.ObjectId(jobPostId),
      clientId: new Types.ObjectId(clientId),
      providerId: new Types.ObjectId(providerId),
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

    await JobPost.findByIdAndUpdate(jobPostId, {
      status: "matched",
      assignedProviderId: new Types.ObjectId(providerId),
    });

    // ── Append Quoter trace to AgentLog ──────────────────────────────────
    const quoterTrace = {
      name: "Quoter" as const,
      input: { jobPostId, providerId },
      systemPrompt: quoterAgent.SYSTEM_PROMPT,
      reasoning: quoterOutput.reasoning,
      toolsCalled: [],
      output: quoterOutput as unknown as Record<string, unknown>,
      latencyMs: quoterLatency,
      inputTokens: 0,
      outputTokens: 0,
    };

    const updated = await AgentLog.findOneAndUpdate(
      { sessionId },
      {
        $push: { agents: quoterTrace },
        $inc: { totalLatencyMs: quoterLatency },
        $set: { finalOutcome: `Booking ${booking._id} created. Total PKR ${pricing.total}` }
      }
    );

    if (!updated) {
      await AgentLog.create({
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
  private async _queryNearbyProviders(
    coordinates: [number, number],
    serviceType: string,
    maxDistanceMetres: number
  ): Promise<GeoNearProviderDoc[]> {
    const results = await Provider.aggregate<GeoNearProviderDoc>([
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

// ─── Singleton Export ─────────────────────────────────────────────────────────

/** Shared orchestrator instance — import this in controllers. */
export const orchestrator = new MahirOrchestrator();
