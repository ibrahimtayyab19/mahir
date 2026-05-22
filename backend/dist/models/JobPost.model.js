"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Schema ───────────────────────────────────────────────────────────────────
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
const JOB_STATUSES = [
    "open", "matched", "accepted", "in_progress",
    "completed", "cancelled", "expired",
];
const JobPostSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId, ref: "User",
        required: [true, "clientId is required"], index: true,
    },
    // Core
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    category: { type: String, required: true, trim: true, index: true },
    serviceType: { type: String, trim: true, default: "" }, // set by orchestrator
    // AI-generated descriptions
    rawInput: { type: String, trim: true },
    descriptionEN: { type: String, trim: true },
    descriptionUR: { type: String, trim: true },
    descriptionRU: { type: String, trim: true },
    aiSummary: { type: String, trim: true, maxlength: 300 },
    aiGeneratedAt: { type: Date },
    // Intent
    urgency: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },
    preferredTime: { type: String, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    // Location
    location: { type: GeoJSONPointSchema, required: [true, "location is required"] },
    address: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    // Budget
    budgetMinPKR: { type: Number, required: true, min: 0 },
    budgetMaxPKR: { type: Number, required: true },
    agreedPricePKR: { type: Number, min: 0 },
    budgetRange: {
        type: { min: Number, max: Number },
        _id: false,
    },
    // Status
    status: {
        type: String,
        enum: { values: JOB_STATUSES, message: "Invalid job status" },
        default: "open",
        index: true,
    },
    assignedProviderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Provider" },
    matchedProviderIds: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Provider", default: [] },
    // TTL — auto-delete 0 seconds after expiresAt (= 24h from creation)
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
}, { timestamps: true, versionKey: false });
// ─── Indexes ──────────────────────────────────────────────────────────────────
JobPostSchema.index({ location: "2dsphere" });
JobPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
JobPostSchema.index({ status: 1, city: 1, createdAt: -1 });
JobPostSchema.index({ status: 1, serviceType: 1 });
// ─── Export ───────────────────────────────────────────────────────────────────
const JobPost = (0, mongoose_1.model)("JobPost", JobPostSchema);
exports.default = JobPost;
//# sourceMappingURL=JobPost.model.js.map