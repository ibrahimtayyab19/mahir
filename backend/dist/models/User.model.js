"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Schema ──────────────────────────────────────────────────────────────────
const GeoJSONPointSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: (v) => v.length === 2 &&
                v[0] >= -180 &&
                v[0] <= 180 &&
                v[1] >= -90 &&
                v[1] <= 90,
            message: "coordinates must be [longitude, latitude] with valid ranges",
        },
    },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [80, "Name must be at most 80 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    passwordHash: {
        type: String,
        required: [true, "Password hash is required"],
        select: false, // Never returned in queries by default
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?\d{7,15}$/, "Invalid phone number format"],
    },
    role: {
        type: String,
        enum: {
            values: ["client", "provider"],
            message: "Role must be 'client' or 'provider'",
        },
        required: [true, "Role is required"],
    },
    location: {
        type: GeoJSONPointSchema,
        default: undefined,
    },
    city: {
        type: String,
        trim: true,
    },
    area: {
        type: String,
        trim: true,
    },
    avatarUrl: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    refreshToken: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ location: "2dsphere" }, { sparse: true });
UserSchema.index({ role: 1 });
// ─── Model Export ─────────────────────────────────────────────────────────────
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
//# sourceMappingURL=User.model.js.map