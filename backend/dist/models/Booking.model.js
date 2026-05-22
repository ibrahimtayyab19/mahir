"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Schema ──────────────────────────────────────────────────────────────────
const BOOKING_STATUSES = [
    "pending",
    "confirmed",
    "en-route",
    "in-progress",
    "completed",
    "cancelled",
    "disputed",
];
const BookingPricingSchema = new mongoose_1.Schema({
    baseFee: { type: Number, required: true, min: 0 },
    distanceCharge: { type: Number, required: true, min: 0 },
    urgencySurge: { type: Number, required: true, min: 0 },
    peakHourCharge: { type: Number, required: true, min: 0 },
    totalEstimate: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["PKR"], default: "PKR" },
}, { _id: false });
const BookingSchema = new mongoose_1.Schema({
    jobPostId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "JobPost",
        required: [true, "jobPostId is required"],
        index: true,
    },
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "clientId is required"],
        index: true,
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Provider",
        required: [true, "providerId is required"],
        index: true,
    },
    serviceType: {
        type: String,
        required: [true, "serviceType is required"],
        trim: true,
    },
    // Status
    status: {
        type: String,
        enum: {
            values: BOOKING_STATUSES,
            message: `Status must be one of: ${BOOKING_STATUSES.join(", ")}`,
        },
        default: "pending",
        index: true,
    },
    statusHistory: [
        {
            status: {
                type: String,
                enum: BOOKING_STATUSES,
                required: true,
            },
            timestamp: {
                type: Date,
                required: true,
                default: Date.now,
            },
            note: {
                type: String,
                trim: true,
                maxlength: 200,
            },
            _id: false,
        },
    ],
    // Scheduling
    scheduledTime: {
        type: Date,
        required: [true, "scheduledTime is required"],
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    // Pricing (§5D sub-document)
    pricing: {
        type: BookingPricingSchema,
        required: [true, "pricing is required"],
    },
    // Completion
    completionPhotos: { type: [String], default: [] },
    // Review
    clientRating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
    },
    providerRating: {
        type: Number,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
    },
    // Agent session link
    agentSessionId: {
        type: String,
        required: [true, "agentSessionId is required"],
        index: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// ─── Indexes ──────────────────────────────────────────────────────────────────
BookingSchema.index({ clientId: 1, status: 1 });
BookingSchema.index({ providerId: 1, status: 1 });
// ─── Model Export ─────────────────────────────────────────────────────────────
const Booking = (0, mongoose_1.model)("Booking", BookingSchema);
exports.default = Booking;
//# sourceMappingURL=Booking.model.js.map