"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.globalErrorHandler = exports.ApiError = void 0;
// ─── API Error Class ──────────────────────────────────────────────────────────
/**
 * Operational errors that should be sent back to the client.
 * Differentiated from programmer errors (which should crash the process in dev).
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// ─── Global Error Handler Middleware ─────────────────────────────────────────
/**
 * Must be mounted LAST in the Express middleware chain (after all routes).
 * Catches both ApiError instances and unexpected programmer errors.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (err, _req, res, _next) => {
    const isDev = process.env["NODE_ENV"] === "development";
    // Determine status code
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    // Determine the user-facing error message
    const message = err instanceof ApiError
        ? err.message
        : isDev
            ? err.message
            : "An unexpected internal server error occurred";
    const body = {
        success: false,
        error: message,
        ...(isDev && { stack: err.stack }),
    };
    if (statusCode >= 500) {
        console.error(`🔴 [${statusCode}] ${err.message}`, isDev ? err.stack : "");
    }
    else {
        console.warn(`🟡 [${statusCode}] ${err.message}`);
    }
    res.status(statusCode).json(body);
};
exports.globalErrorHandler = globalErrorHandler;
// ─── 404 Not Found Handler ────────────────────────────────────────────────────
/**
 * Mount this AFTER all routes but BEFORE globalErrorHandler.
 * Converts unmatched routes into a proper ApiError.
 */
const notFoundHandler = (req, _res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFoundHandler = notFoundHandler;
// ─── Async Wrapper ────────────────────────────────────────────────────────────
/**
 * Wraps async route handlers so thrown errors are forwarded to next().
 * Use this instead of try/catch boilerplate in every controller.
 *
 * @example
 * router.get("/example", asyncHandler(async (req, res) => {
 *   const data = await someAsyncOp();
 *   res.json({ success: true, data });
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map