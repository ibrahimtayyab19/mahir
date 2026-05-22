"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Provider_model_1 = __importDefault(require("../models/Provider.model"));
const error_middleware_1 = require("../middleware/error.middleware");
// ─── Helpers ──────────────────────────────────────────────────────────────────
const signToken = (payload) => {
    const secret = process.env["JWT_SECRET"];
    if (!secret)
        throw new error_middleware_1.ApiError(500, "JWT_SECRET is not configured");
    // jsonwebtoken's expiresIn expects `StringValue` from the `ms` package.
    // Casting via `as never` threads the strict overload without pulling in `ms` types.
    const expiresIn = (process.env["JWT_EXPIRES_IN"] ?? "7d");
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
// ─── Controllers ──────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password, role, phone? }
 * Creates a User document. If role === "provider", also creates a Provider profile.
 */
exports.register = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
        throw new error_middleware_1.ApiError(400, "name, email, password, and role are required");
    }
    if (role !== "client" && role !== "provider") {
        throw new error_middleware_1.ApiError(400, "role must be 'client' or 'provider'");
    }
    if (password.length < 8) {
        throw new error_middleware_1.ApiError(400, "Password must be at least 8 characters");
    }
    const existing = await User_model_1.default.findOne({ email: email.toLowerCase() });
    if (existing) {
        throw new error_middleware_1.ApiError(409, "An account with this email already exists");
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await User_model_1.default.create({
        name,
        email,
        passwordHash,
        role,
        phone,
    });
    // Create the provider profile stub if registering as a provider
    if (role === "provider") {
        await Provider_model_1.default.create({
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
});
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new error_middleware_1.ApiError(400, "email and password are required");
    }
    // Explicitly select passwordHash since it's excluded by default
    const user = await User_model_1.default.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
        throw new error_middleware_1.ApiError(401, "Invalid email or password");
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new error_middleware_1.ApiError(401, "Invalid email or password");
    }
    if (!user.isActive) {
        throw new error_middleware_1.ApiError(403, "This account has been suspended");
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
});
/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Protected by authenticate middleware.
 */
exports.getMe = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await User_model_1.default.findById(req.user?.userId);
    if (!user) {
        throw new error_middleware_1.ApiError(404, "User not found");
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
});
//# sourceMappingURL=auth.controller.js.map