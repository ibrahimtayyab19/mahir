"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientMessages = exports.rateProvider = exports.getBookingById = exports.getMyBookings = exports.getMyJobs = exports.createJob = exports.selectProvider = exports.requestJob = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const orchestrator_1 = require("../agents/orchestrator");
const JobPost_model_1 = __importDefault(require("../models/JobPost.model"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const Message_model_1 = __importDefault(require("../models/Message.model"));
const Provider_model_1 = __importDefault(require("../models/Provider.model"));
// ─── Controllers ──────────────────────────────────────────────────────────────
/**
 * POST /api/client/request
 * AI-powered job intake.
 * Body: { rawMessage, latitude, longitude }
 */
exports.requestJob = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
            agentTraces: result.agentTraces,
        },
    });
});
/**
 * POST /api/client/select
 * Client selects a specific provider from the matches.
 * Body: { sessionId, jobPostId, providerId }
 */
exports.selectProvider = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
        },
    });
});
/**
 * POST /api/client/jobs
 * Standard (non-AI) job creation — kept for backward compatibility.
 */
exports.createJob = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    if (!clientId)
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    const { title, description, category, latitude, longitude, address, city, budgetMinPKR, budgetMaxPKR, } = req.body;
    if (!title || !description || !category ||
        !latitude || !longitude || !address || !city ||
        !budgetMinPKR || !budgetMaxPKR) {
        throw new error_middleware_1.ApiError(400, "Missing required job fields");
    }
    const job = await JobPost_model_1.default.create({
        clientId,
        title,
        description,
        category,
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
        },
        address,
        city,
        budgetMinPKR: Number(budgetMinPKR),
        budgetMaxPKR: Number(budgetMaxPKR),
    });
    res.status(201).json({ success: true, data: job });
});
/**
 * GET /api/client/jobs
 * Returns all job posts created by the authenticated client.
 */
exports.getMyJobs = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    const jobs = await JobPost_model_1.default.find({ clientId })
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json({ success: true, data: jobs });
});
/**
 * GET /api/client/bookings
 * Returns all bookings for the authenticated client, with full provider + job details.
 */
exports.getMyBookings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    const bookings = await Booking_model_1.default.find({ clientId })
        .populate({
        path: "providerId",
        select: "rating onTimeScore pricePerHour verifiedBadge serviceCategory",
        populate: { path: "userId", select: "name phone avatarUrl" },
    })
        .populate("jobPostId", "title category address city urgency status descriptionEN")
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
});
/**
 * GET /api/client/bookings/:id
 * Returns a single booking by ID — client must own it.
 */
exports.getBookingById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    const { id } = req.params;
    const booking = await Booking_model_1.default.findOne({ _id: id, clientId })
        .populate({
        path: "providerId",
        populate: { path: "userId", select: "name phone avatarUrl" },
    })
        .populate("jobPostId")
        .lean();
    if (!booking)
        throw new error_middleware_1.ApiError(404, "Booking not found");
    res.status(200).json({ success: true, data: booking });
});
/**
 * POST /api/client/rate
 * Submit a rating and optional review after job completion (§8).
 * Body: { bookingId, rating, review? }
 */
exports.rateProvider = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    if (!clientId)
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    const { bookingId, rating, review } = req.body;
    if (!bookingId || typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new error_middleware_1.ApiError(400, "bookingId and rating (1-5) are required");
    }
    const booking = await Booking_model_1.default.findOne({ _id: bookingId, clientId });
    if (!booking)
        throw new error_middleware_1.ApiError(404, "Booking not found");
    if (booking.status !== "completed") {
        throw new error_middleware_1.ApiError(409, "Can only rate completed bookings");
    }
    if (booking.clientRating) {
        throw new error_middleware_1.ApiError(409, "You have already rated this booking");
    }
    booking.clientRating = rating;
    await booking.save();
    // Recalculate provider's average rating
    const provider = await Provider_model_1.default.findById(booking.providerId);
    if (provider) {
        const allBookings = await Booking_model_1.default.find({
            providerId: provider._id,
            clientRating: { $exists: true, $ne: null },
        }).lean();
        const totalRatings = allBookings.reduce((sum, b) => sum + (b.clientRating ?? 0), 0);
        const avgRating = allBookings.length > 0 ? totalRatings / allBookings.length : 0;
        provider.rating = Math.round(avgRating * 10) / 10;
        provider.totalReviews = allBookings.length;
        await provider.save();
    }
    res.status(200).json({
        success: true,
        message: "Rating submitted successfully",
        data: { bookingId, rating, review: review ?? null },
    });
});
/**
 * GET /api/client/messages
 * Returns conversation list for the authenticated client (§8).
 */
exports.getClientMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    if (!clientId)
        throw new error_middleware_1.ApiError(401, "Not authenticated");
    // Get all bookings for this client, then find messages
    const bookings = await Booking_model_1.default.find({ clientId })
        .select("_id providerId serviceType")
        .populate({
        path: "providerId",
        select: "serviceCategory",
        populate: { path: "userId", select: "name avatarUrl" },
    })
        .lean();
    const bookingIds = bookings.map((b) => b._id);
    // Get last message per booking
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
//# sourceMappingURL=client.controller.js.map