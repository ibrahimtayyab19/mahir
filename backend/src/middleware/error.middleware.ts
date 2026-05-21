import { Request, Response, NextFunction } from "express";

// ─── API Error Class ──────────────────────────────────────────────────────────

/**
 * Operational errors that should be sent back to the client.
 * Differentiated from programmer errors (which should crash the process in dev).
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Response Shape ─────────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  error: string;
  stack?: string;
}

// ─── Global Error Handler Middleware ─────────────────────────────────────────

/**
 * Must be mounted LAST in the Express middleware chain (after all routes).
 * Catches both ApiError instances and unexpected programmer errors.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env["NODE_ENV"] === "development";

  // Determine status code
  const statusCode =
    err instanceof ApiError ? err.statusCode : 500;

  // Determine the user-facing error message
  const message =
    err instanceof ApiError
      ? err.message
      : isDev
      ? err.message
      : "An unexpected internal server error occurred";

  const body: ErrorResponse = {
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    console.error(`🔴 [${statusCode}] ${err.message}`, isDev ? err.stack : "");
  } else {
    console.warn(`🟡 [${statusCode}] ${err.message}`);
  }

  res.status(statusCode).json(body);
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────

/**
 * Mount this AFTER all routes but BEFORE globalErrorHandler.
 * Converts unmatched routes into a proper ApiError.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

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
export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
