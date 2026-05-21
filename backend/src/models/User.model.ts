import { Schema, model, Document, Types } from "mongoose";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export type UserRole = "client" | "provider";

/**
 * GeoJSON Point sub-document for 2dsphere indexing.
 * Used for proximity-based job matching.
 */
interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  location?: GeoJSONPoint;
  city?: string;
  area?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const GeoJSONPointSchema = new Schema<GeoJSONPoint>(
  {
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
        validator: (v: number[]) =>
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 &&
          v[1] >= -90 &&
          v[1] <= 90,
        message: "coordinates must be [longitude, latitude] with valid ranges",
      },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
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
        values: ["client", "provider"] as UserRole[],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

UserSchema.index({ location: "2dsphere" }, { sparse: true });
UserSchema.index({ role: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

const User = model<IUserDocument>("User", UserSchema);
export default User;
