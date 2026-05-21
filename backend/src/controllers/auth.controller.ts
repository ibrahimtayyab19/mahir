import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import Provider from "../models/Provider.model";
import { ApiError, asyncHandler } from "../middleware/error.middleware";
import type { JwtPayload } from "../middleware/auth.middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (payload: Omit<JwtPayload, "iat" | "exp">): string => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new ApiError(500, "JWT_SECRET is not configured");

  // jsonwebtoken's expiresIn expects `StringValue` from the `ms` package.
  // Casting via `as never` threads the strict overload without pulling in `ms` types.
  const expiresIn = (process.env["JWT_EXPIRES_IN"] ?? "7d") as never;
  return jwt.sign(payload, secret, { expiresIn });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, phone? }
 * Creates a User document. If role === "provider", also creates a Provider profile.
 */
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      phone?: string;
    };

    if (!name || !email || !password || !role) {
      throw new ApiError(400, "name, email, password, and role are required");
    }

    if (role !== "client" && role !== "provider") {
      throw new ApiError(400, "role must be 'client' or 'provider'");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      phone,
    });

    // Create the provider profile stub if registering as a provider
    if (role === "provider") {
      await Provider.create({
        userId: user._id,
        location: { type: "Point", coordinates: [0, 0] }, // Placeholder — updated on first GPS fix
      });
    }

    const token = signToken({ userId: user._id.toString(), role });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  }
);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw new ApiError(400, "email and password are required");
    }

    // Explicitly select passwordHash since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isActive) {
      throw new ApiError(403, "This account has been suspended");
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  }
);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Protected by authenticate middleware.
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        location: user.location,
      },
    });
  }
);
