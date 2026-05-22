"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
// ─── Middleware ───────────────────────────────────────────────────────────────
/**
 * Verifies the JWT access token from the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 */
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new error_middleware_1.ApiError(401, "No token provided"));
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env["JWT_SECRET"];
    if (!secret) {
        return next(new error_middleware_1.ApiError(500, "JWT_SECRET is not configured on the server"));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        const message = err instanceof jsonwebtoken_1.default.TokenExpiredError
            ? "Token has expired"
            : "Invalid token";
        next(new error_middleware_1.ApiError(401, message));
    }
};
exports.authenticate = authenticate;
/**
 * Role-based access guard. Must be used AFTER authenticate().
 *
 * @example
 * router.get("/provider-only", authenticate, authorize("provider"), handler);
 */
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new error_middleware_1.ApiError(401, "Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
        return next(new error_middleware_1.ApiError(403, `Access denied. Required role(s): ${roles.join(", ")}`));
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map