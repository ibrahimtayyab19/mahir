"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Sub-schema ───────────────────────────────────────────────────────────────
const GeoJSONPointSchema = new mongoose_1.Schema({
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: (v) => v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
            message: "coordinates must be [longitude, latitude]",
        },
    },
}, { _id: false });
// ─── Schema ───────────────────────────────────────────────────────────────────
const ProviderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "userId is required"],
        unique: true,
        index: true,
    },
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 500 },
    // Service Category — indexed for $geoNear filter query
    serviceCategory: {
        type: String,
        trim: true,
        default: "",
        index: true,
    },
    // Location & Presence
    location: { type: GeoJSONPointSchema, required: [true, "location is required"] },
    isActive: { type: Boolean, default: false, index: true },
    lastSeenAt: { type: Date },
    socketId: { type: String, trim: true },
    // AI Matching Factors
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    onTimeScore: { type: Number, default: 100, min: 0, max: 100 },
    completionRate: { type: Number, default: 100, min: 0, max: 100 },
    responseTimeMinutes: { type: Number, default: 30, min: 0 },
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
    reviewSentiment: { type: Number, default: 0, min: -1, max: 1 },
    // Earnings
    totalJobsCompleted: { type: Number, default: 0, min: 0 },
    totalEarningsPKR: { type: Number, default: 0, min: 0 },
    walletBalance: { type: Number, default: 0, min: 0 },
    pricePerHour: { type: Number, default: 500, min: 0 },
    // Verification
    cnicVerified: { type: Boolean, default: false },
    backgroundCheckPassed: { type: Boolean, default: false },
    verifiedBadge: { type: Boolean, default: false },
    // Profile
    portfolioPhotos: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });
// ─── Indexes ──────────────────────────────────────────────────────────────────
ProviderSchema.index({ location: "2dsphere" });
ProviderSchema.index({ isActive: 1, rating: -1, onTimeScore: -1 });
ProviderSchema.index({ serviceCategory: 1, isActive: 1 });
// ─── Export ───────────────────────────────────────────────────────────────────
const Provider = (0, mongoose_1.model)("Provider", ProviderSchema);
exports.default = Provider;
//# sourceMappingURL=Provider.model.js.map