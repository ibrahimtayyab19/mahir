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
exports.chatWithAgent = exports.getProviderMessages = exports.getProviderStats = exports.getEarnings = exports.uploadPhoto = exports.updateJobStatus = exports.getProviderBookings = exports.acceptJob = exports.getNearbyJobs = exports.toggleStatus = exports.updateProviderProfile = exports.getProviderProfile = void 0;
const mongoose_1 = require("mongoose");
const Provider_model_1 = __importDefault(require("../models/Provider.model"));
const JobPost_model_1 = __importDefault(require("../models/JobPost.model"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const Message_model_1 = __importDefault(require("../models/Message.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const socketHandlers_1 = require("../socket/socketHandlers");
const providerAgent = __importStar(require("../agents/providerAgent"));
// ─── Profile ──────────────────────────────────────────────────────────────────
/**
 * GET /api/provider/profile
 */
exports.getProviderProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const provider = await Provider_model_1.default.findOne({ userId }).populate("userId", "name email phone avatarUrl");
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    res.status(200).json({ success: true, data: provider });
});
/**
 * PATCH /api/provider/profile
 * Body: { skills?, bio?, serviceCategory?, latitude?, longitude? }
 */
exports.updateProviderProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { skills, bio, serviceCategory, latitude, longitude } = req.body;
    const updateData = {};
    if (skills !== undefined)
        updateData["skills"] = skills;
    if (bio !== undefined)
        updateData["bio"] = bio;
    if (serviceCategory !== undefined)
        updateData["serviceCategory"] = serviceCategory;
    if (typeof latitude === "number" && typeof longitude === "number") {
        updateData["location"] = {
            type: "Point",
            coordinates: [longitude, latitude],
        };
    }
    const provider = await Provider_model_1.default.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true }).populate("userId", "name email phone avatarUrl");
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    res.status(200).json({ success: true, data: provider });
});
// ─── Presence ─────────────────────────────────────────────────────────────────
/**
 * PUT /api/provider/status (§8)
 * Toggle provider online/offline status and update live location.
 * Body: { isActive, latitude, longitude }
 */
exports.toggleStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { isActive, latitude, longitude } = req.body;
    if (typeof isActive !== "boolean") {
        throw new error_middleware_1.ApiError(400, "isActive (boolean) is required");
    }
    const updateData = {
        isActive,
        lastSeenAt: new Date(),
    };
    if (typeof latitude === "number" && typeof longitude === "number") {
        updateData["location"] = {
            type: "Point",
            coordinates: [longitude, latitude],
        };
    }
    const provider = await Provider_model_1.default.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    // Emit presence change via Socket.io
    try {
        const io = (0, socketHandlers_1.getIo)();
        io.to(`provider:${provider._id.toString()}`).emit("provider:status_ack", { isActive });
    }
    catch {
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
});
// ─── Jobs ─────────────────────────────────────────────────────────────────────
/**
 * GET /api/provider/jobs
 * Available jobs near the provider (§8). Uses $geoNear.
 * Query params: ?lat=&lng=&radiusKm=&category=&limit=
 */
exports.getNearbyJobs = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { lat, lng, radiusKm = "10", limit = "20", category } = req.query;
    if (!lat || !lng) {
        throw new error_middleware_1.ApiError(400, "lat and lng query parameters are required");
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm ?? "10");
    const maxResults = parseInt(limit ?? "20", 10);
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
        throw new error_middleware_1.ApiError(400, "lat, lng, and radiusKm must be valid numbers");
    }
    const geoQuery = { status: "open" };
    if (category) {
        geoQuery["$or"] = [
            { category: { $regex: new RegExp(category, "i") } },
            { category: "Other" }
        ];
    }
    const jobs = await JobPost_model_1.default.aggregate([
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
});
/**
 * POST /api/provider/accept (§8)
 * Provider accepts an assigned (matched/open) job, creating a pending Booking.
 * Body: { agreedPricePKR, scheduledAt }
 */
exports.acceptJob = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { jobId } = req.params;
    const provider = await Provider_model_1.default.findOne({ userId });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const job = await JobPost_model_1.default.findById(jobId);
    if (!job)
        throw new error_middleware_1.ApiError(404, "Job not found");
    if (job.status !== "open" && job.status !== "matched") {
        throw new error_middleware_1.ApiError(409, `Cannot accept a job with status: ${job.status}`);
    }
    const { agreedPricePKR, scheduledAt } = req.body;
    if (!agreedPricePKR || !scheduledAt) {
        throw new error_middleware_1.ApiError(400, "agreedPricePKR and scheduledAt are required");
    }
    const booking = await Booking_model_1.default.create({
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
    await JobPost_model_1.default.findByIdAndUpdate(jobId, {
        status: "accepted",
        assignedProviderId: provider._id,
    });
    // Emit booking creation to the client's room
    try {
        const io = (0, socketHandlers_1.getIo)();
        io.to(`client:${job.clientId.toString()}`).emit("booking:status", {
            bookingId: booking._id.toString(),
            status: "pending",
            jobPostId: jobId,
            agreedPricePKR,
            scheduledAt,
        });
    }
    catch {
        // Non-fatal
    }
    res.status(201).json({ success: true, data: booking });
});
// ─── Bookings ─────────────────────────────────────────────────────────────────
/**
 * GET /api/provider/bookings
 */
exports.getProviderBookings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const provider = await Provider_model_1.default.findOne({ userId });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const bookings = await Booking_model_1.default.find({ providerId: provider._id })
        .populate("clientId", "name phone avatarUrl")
        .populate("jobPostId", "title category address city urgency status")
        .sort({ scheduledTime: 1 })
        .lean();
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
});
/**
 * PUT /api/provider/job/:id (§8)
 * Update job status (en-route, in-progress, done).
 * Body: { status: "en-route"|"in-progress"|"completed"|"cancelled", note? }
 */
exports.updateJobStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const provider = await Provider_model_1.default.findOne({ userId });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const { status, note } = req.body;
    const ALLOWED = ["confirmed", "en-route", "in-progress", "completed", "cancelled"];
    if (!status || !ALLOWED.includes(status)) {
        throw new error_middleware_1.ApiError(400, `status must be one of: ${ALLOWED.join(", ")}`);
    }
    const booking = await Booking_model_1.default.findOne({ _id: id, providerId: provider._id });
    if (!booking)
        throw new error_middleware_1.ApiError(404, "Booking not found");
    const now = new Date();
    booking.status = status;
    booking.statusHistory.push({ status, timestamp: now, note });
    if (status === "in-progress")
        booking.startedAt = now;
    if (status === "completed") {
        booking.completedAt = now;
        await JobPost_model_1.default.findByIdAndUpdate(booking.jobPostId, { status: "completed" });
        // Update provider stats on completion
        await Provider_model_1.default.findByIdAndUpdate(provider._id, {
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
        const io = (0, socketHandlers_1.getIo)();
        io.to(`client:${booking.clientId.toString()}`).emit("booking:status", {
            bookingId: id,
            status,
            note,
            message: `Provider status updated to: ${status}`,
        });
    }
    catch {
        // Non-fatal
    }
    res.status(200).json({ success: true, data: booking });
});
/**
 * POST /api/provider/photo (§8)
 * Upload completion photo URL. Body: { bookingId, photoUrl }
 */
exports.uploadPhoto = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const provider = await Provider_model_1.default.findOne({ userId });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const { bookingId, photoUrl } = req.body;
    if (!bookingId || !photoUrl) {
        throw new error_middleware_1.ApiError(400, "bookingId and photoUrl are required");
    }
    const booking = await Booking_model_1.default.findOne({ _id: bookingId, providerId: provider._id });
    if (!booking)
        throw new error_middleware_1.ApiError(404, "Booking not found");
    booking.completionPhotos.push(photoUrl);
    await booking.save();
    res.status(200).json({
        success: true,
        message: "Photo added",
        data: { completionPhotos: booking.completionPhotos },
    });
});
// ─── Earnings ─────────────────────────────────────────────────────────────────
/**
 * GET /api/provider/earnings (§8)
 * Wallet summary for the provider dashboard.
 */
exports.getEarnings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const provider = await Provider_model_1.default.findOne({ userId }).lean();
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const providerId = new mongoose_1.Types.ObjectId(provider._id.toString());
    const [completedCount, pendingCount, totalEarned] = await Promise.all([
        Booking_model_1.default.countDocuments({ providerId, status: "completed" }),
        Booking_model_1.default.countDocuments({ providerId, status: { $in: ["pending", "confirmed"] } }),
        Booking_model_1.default.aggregate([
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
});
/**
 * GET /api/provider/stats
 * Alias for earnings (backward compat).
 */
exports.getProviderStats = exports.getEarnings;
/**
 * GET /api/provider/messages (§8)
 * Conversation list for the provider.
 */
exports.getProviderMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const provider = await Provider_model_1.default.findOne({ userId });
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const bookings = await Booking_model_1.default.find({ providerId: provider._id })
        .select("_id clientId serviceType")
        .populate("clientId", "name avatarUrl")
        .lean();
    const bookingIds = bookings.map((b) => b._id);
    const conversations = await Message_model_1.default.aggregate([
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
});
// ─── AI Agent ─────────────────────────────────────────────────────────────────
/**
 * POST /api/provider/chat
 * Conversational AI agent for providers.
 * Body: { message: string }
 */
exports.chatWithAgent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
        throw new error_middleware_1.ApiError(400, "message is required");
    }
    const provider = await Provider_model_1.default.findOne({ userId }).lean();
    if (!provider)
        throw new error_middleware_1.ApiError(404, "Provider profile not found");
    const result = await providerAgent.run(message.trim(), provider.serviceCategory || "General Services");
    res.status(200).json({ success: true, data: result });
});
//# sourceMappingURL=provider.controller.js.map