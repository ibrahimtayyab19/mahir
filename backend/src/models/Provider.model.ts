import { Schema, model, Document, Types } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface IProvider {
  userId: Types.ObjectId;
  skills: string[];
  bio?: string;

  // ── Service Category (added Phase 5) ─────────────────────────────────────
  serviceCategory: string;  // 'AC Technician' | 'Plumber' | 'Electrician' etc.

  // ── Location & Presence ──────────────────────────────────────────────────
  location: GeoJSONPoint;
  isActive: boolean;
  lastSeenAt?: Date;
  socketId?: string;        // Current Socket.io connection ID

  // ── AI Matching Factors ──────────────────────────────────────────────────
  rating: number;
  totalReviews: number;
  onTimeScore: number;
  completionRate: number;
  responseTimeMinutes: number;
  cancellationRate: number;   // 0–100% (Phase 5 — lower is better)
  reviewSentiment: number;    // -1.0 to 1.0 (NLP score of reviews)

  // ── Earnings ─────────────────────────────────────────────────────────────
  totalJobsCompleted: number;
  totalEarningsPKR: number;
  walletBalance: number;      // PKR available for withdrawal
  pricePerHour: number;       // PKR — used by Agent 3 for pricing

  // ── Verification ─────────────────────────────────────────────────────────
  cnicVerified: boolean;
  backgroundCheckPassed: boolean;
  verifiedBadge: boolean;

  // ── Profile ───────────────────────────────────────────────────────────────
  portfolioPhotos: string[];
  experienceYears: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProviderDocument extends IProvider, Document {
  _id: Types.ObjectId;
}

// ─── Sub-schema ───────────────────────────────────────────────────────────────

const GeoJSONPointSchema = new Schema<GeoJSONPoint>(
  {
    type:        { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) =>
          v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
        message: "coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProviderSchema = new Schema<IProviderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },
    skills:          { type: [String], default: [] },
    bio:             { type: String, trim: true, maxlength: 500 },

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
    socketId:   { type: String, trim: true },

    // AI Matching Factors
    rating:               { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:         { type: Number, default: 0, min: 0 },
    onTimeScore:          { type: Number, default: 100, min: 0, max: 100 },
    completionRate:       { type: Number, default: 100, min: 0, max: 100 },
    responseTimeMinutes:  { type: Number, default: 30, min: 0 },
    cancellationRate:     { type: Number, default: 0, min: 0, max: 100 },
    reviewSentiment:      { type: Number, default: 0, min: -1, max: 1 },

    // Earnings
    totalJobsCompleted: { type: Number, default: 0, min: 0 },
    totalEarningsPKR:   { type: Number, default: 0, min: 0 },
    walletBalance:      { type: Number, default: 0, min: 0 },
    pricePerHour:       { type: Number, default: 500, min: 0 },

    // Verification
    cnicVerified:         { type: Boolean, default: false },
    backgroundCheckPassed:{ type: Boolean, default: false },
    verifiedBadge:        { type: Boolean, default: false },

    // Profile
    portfolioPhotos: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ProviderSchema.index({ location: "2dsphere" });
ProviderSchema.index({ isActive: 1, rating: -1, onTimeScore: -1 });
ProviderSchema.index({ serviceCategory: 1, isActive: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

const Provider = model<IProviderDocument>("Provider", ProviderSchema);
export default Provider;
