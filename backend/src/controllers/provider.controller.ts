import { Request, Response } from "express";
import { Types } from "mongoose";
import Provider from "../models/Provider.model";
import JobPost from "../models/JobPost.model";
import Booking from "../models/Booking.model";
import Message from "../models/Message.model";
import { ApiError, asyncHandler } from "../middleware/error.middleware";
import { getIo } from "../socket/socketHandlers";
import * as providerAgent from "../agents/providerAgent";

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /api/provider/profile
 */
export const getProviderProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const provider = await Provider.findOne({ userId }).populate(
      "userId",
      "name email phone avatarUrl"
    );

    if (!provider) throw new ApiError(404, "Provider profile not found");

    res.status(200).json({ success: true, data: provider });
  }
);

/**
 * PATCH /api/provider/profile
 * Body: { skills?, bio?, serviceCategory?, latitude?, longitude? }
 */
export const updateProviderProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const { skills, bio, serviceCategory, latitude, longitude } = req.body as {
      skills?: string[];
      bio?: string;
      serviceCategory?: string;
      latitude?: number;
      longitude?: number;
    };

    const updateData: Record<string, unknown> = {};
    if (skills !== undefined) updateData["skills"] = skills;
    if (bio !== undefined) updateData["bio"] = bio;
    if (serviceCategory !== undefined) updateData["serviceCategory"] = serviceCategory;
    if (typeof latitude === "number" && typeof longitude === "number") {
      updateData["location"] = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const provider = await Provider.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("userId", "name email phone avatarUrl");

    if (!provider) throw new ApiError(404, "Provider profile not found");

    res.status(200).json({ success: true, data: provider });
  }
);

// ─── Presence ─────────────────────────────────────────────────────────────────

/**
 * PUT /api/provider/status (§8)
 * Toggle provider online/offline status and update live location.
 * Body: { isActive, latitude, longitude }
 */
export const toggleStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const { isActive, latitude, longitude } = req.body as {
      isActive?: boolean;
      latitude?: number;
      longitude?: number;
    };

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive (boolean) is required");
    }

    const updateData: Record<string, unknown> = {
      isActive,
      lastSeenAt: new Date(),
    };

    if (typeof latitude === "number" && typeof longitude === "number") {
      updateData["location"] = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const provider = await Provider.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!provider) throw new ApiError(404, "Provider profile not found");

    // Emit presence change via Socket.io
    try {
      const io = getIo();
      io.to(`provider:${provider._id.toString()}`).emit("provider:status_ack", { isActive });
    } catch {
      // Non-fatal
    }

    res.status(200).json({
      success: true,
      data: {
        providerId: provider._id,
        isActive: provider.isActive,
        lastSeenAt: provider.lastSeenAt,
      },
    });
  }
);

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/provider/jobs
 * Available jobs near the provider (§8). Uses $geoNear.
 * Query params: ?lat=&lng=&radiusKm=&category=&limit=
 */
export const getNearbyJobs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { lat, lng, radiusKm = "10", limit = "20", category } = req.query as Record<
      string,
      string | undefined
    >;

    if (!lat || !lng) {
      throw new ApiError(400, "lat and lng query parameters are required");
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm ?? "10");
    const maxResults = parseInt(limit ?? "20", 10);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      throw new ApiError(400, "lat, lng, and radiusKm must be valid numbers");
    }

    const geoQuery: Record<string, unknown> = { status: "open" };
    if (category) {
      geoQuery["$or"] = [
        { category: { $regex: new RegExp(category, "i") } },
        { category: "Other" }
      ];
    }

    const jobs = await JobPost.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMetres",
          maxDistance: radius * 1000,
          query: geoQuery,
          spherical: true,
        },
      },
      { $limit: maxResults },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ["$distanceMetres", 1000] }, 2] },
        },
      },
    ]);

    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  }
);

/**
 * POST /api/provider/accept (§8)
 * Provider accepts an assigned (matched/open) job, creating a pending Booking.
 * Body: { agreedPricePKR, scheduledAt }
 */
export const acceptJob = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const { jobId } = req.params;

    const provider = await Provider.findOne({ userId });
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const job = await JobPost.findById(jobId);
    if (!job) throw new ApiError(404, "Job not found");

    if (job.status !== "open" && job.status !== "matched") {
      throw new ApiError(409, `Cannot accept a job with status: ${job.status}`);
    }

    const { agreedPricePKR, scheduledAt } = req.body as {
      agreedPricePKR?: number;
      scheduledAt?: string;
    };

    if (!agreedPricePKR || !scheduledAt) {
      throw new ApiError(400, "agreedPricePKR and scheduledAt are required");
    }

    const booking = await Booking.create({
      jobPostId: job._id,
      clientId: job.clientId,
      providerId: provider._id,
      serviceType: job.serviceType || job.category,
      scheduledTime: new Date(scheduledAt),
      pricing: {
        baseFee: agreedPricePKR,
        distanceCharge: 0,
        urgencySurge: 0,
        peakHourCharge: 0,
        totalEstimate: agreedPricePKR,
        currency: "PKR",
      },
      agentSessionId: "manual-accept",
      status: "pending",
      statusHistory: [{ status: "pending", timestamp: new Date() }],
    });

    await JobPost.findByIdAndUpdate(jobId, {
      status: "accepted",
      assignedProviderId: provider._id,
    });

    // Emit booking creation to the client's room
    try {
      const io = getIo();
      io.to(`client:${job.clientId.toString()}`).emit("booking:status", {
        bookingId: booking._id.toString(),
        status: "pending",
        jobPostId: jobId,
        agreedPricePKR,
        scheduledAt,
      });
    } catch {
      // Non-fatal
    }

    res.status(201).json({ success: true, data: booking });
  }
);

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * GET /api/provider/bookings
 */
export const getProviderBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const provider = await Provider.findOne({ userId });
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const bookings = await Booking.find({ providerId: provider._id })
      .populate("clientId", "name phone avatarUrl")
      .populate("jobPostId", "title category address city urgency status")
      .sort({ scheduledTime: 1 })
      .lean();

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  }
);

/**
 * PUT /api/provider/job/:id (§8)
 * Update job status (en-route, in-progress, done).
 * Body: { status: "en-route"|"in-progress"|"completed"|"cancelled", note? }
 */
export const updateJobStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const provider = await Provider.findOne({ userId });
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const { status, note } = req.body as {
      status?: string;
      note?: string;
    };

    const ALLOWED: string[] = ["confirmed", "en-route", "in-progress", "completed", "cancelled"];
    if (!status || !ALLOWED.includes(status)) {
      throw new ApiError(400, `status must be one of: ${ALLOWED.join(", ")}`);
    }

    const booking = await Booking.findOne({ _id: id, providerId: provider._id });
    if (!booking) throw new ApiError(404, "Booking not found");

    const now = new Date();
    booking.status = status as typeof booking.status;
    booking.statusHistory.push({ status, timestamp: now, note });

    if (status === "in-progress") booking.startedAt = now;
    if (status === "completed") {
      booking.completedAt = now;
      await JobPost.findByIdAndUpdate(booking.jobPostId, { status: "completed" });

      // Update provider stats on completion
      await Provider.findByIdAndUpdate(provider._id, {
        $inc: {
          totalJobsCompleted: 1,
          totalEarningsPKR: booking.pricing.totalEstimate * 0.9,
          walletBalance: booking.pricing.totalEstimate * 0.9,
        },
      });
    }

    await booking.save();

    // Emit status update to client
    try {
      const io = getIo();
      io.to(`client:${booking.clientId.toString()}`).emit("booking:status", {
        bookingId: id,
        status,
        note,
        message: `Provider status updated to: ${status}`,
      });
    } catch {
      // Non-fatal
    }

    res.status(200).json({ success: true, data: booking });
  }
);

/**
 * POST /api/provider/photo (§8)
 * Upload completion photo URL. Body: { bookingId, photoUrl }
 */
export const uploadPhoto = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const provider = await Provider.findOne({ userId });
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const { bookingId, photoUrl } = req.body as {
      bookingId?: string;
      photoUrl?: string;
    };

    if (!bookingId || !photoUrl) {
      throw new ApiError(400, "bookingId and photoUrl are required");
    }

    const booking = await Booking.findOne({ _id: bookingId, providerId: provider._id });
    if (!booking) throw new ApiError(404, "Booking not found");

    booking.completionPhotos.push(photoUrl);
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Photo added",
      data: { completionPhotos: booking.completionPhotos },
    });
  }
);

// ─── Earnings ─────────────────────────────────────────────────────────────────

/**
 * GET /api/provider/earnings (§8)
 * Wallet summary for the provider dashboard.
 */
export const getEarnings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const provider = await Provider.findOne({ userId }).lean();
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const providerId = new Types.ObjectId(provider._id.toString());

    const [completedCount, pendingCount, totalEarned] = await Promise.all([
      Booking.countDocuments({ providerId, status: "completed" }),
      Booking.countDocuments({ providerId, status: { $in: ["pending", "confirmed"] } }),
      Booking.aggregate<{ total: number }>([
        { $match: { providerId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$pricing.totalEstimate" } } },
      ]),
    ]);

    const grossEarnings = totalEarned[0]?.total ?? 0;
    const netEarnings = Math.round(grossEarnings * 0.9); // 10% platform fee

    res.status(200).json({
      success: true,
      data: {
        rating: provider.rating,
        onTimeScore: provider.onTimeScore,
        completionRate: provider.completionRate,
        totalJobsCompleted: completedCount,
        pendingJobs: pendingCount,
        grossEarningsPKR: grossEarnings,
        netEarningsPKR: netEarnings,
        walletBalance: provider.walletBalance,
      },
    });
  }
);

/**
 * GET /api/provider/stats
 * Alias for earnings (backward compat).
 */
export const getProviderStats = getEarnings;

/**
 * GET /api/provider/messages (§8)
 * Conversation list for the provider.
 */
export const getProviderMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const provider = await Provider.findOne({ userId });
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const bookings = await Booking.find({ providerId: provider._id })
      .select("_id clientId serviceType")
      .populate("clientId", "name avatarUrl")
      .lean();

    const bookingIds = bookings.map((b) => b._id);

    const conversations = await Message.aggregate([
      { $match: { bookingId: { $in: bookingIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$bookingId",
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.status(200).json({ success: true, data: { bookings, conversations } });
  }
);

// ─── AI Agent ─────────────────────────────────────────────────────────────────

/**
 * POST /api/provider/chat
 * Conversational AI agent for providers.
 * Body: { message: string }
 */
export const chatWithAgent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const { message } = req.body as { message?: string };

    if (!message || message.trim().length === 0) {
      throw new ApiError(400, "message is required");
    }

    const provider = await Provider.findOne({ userId }).lean();
    if (!provider) throw new ApiError(404, "Provider profile not found");

    const result = await providerAgent.run(
      message.trim(),
      provider.serviceCategory || "General Services"
    );

    res.status(200).json({ success: true, data: result });
  }
);
