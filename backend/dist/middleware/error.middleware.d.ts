import { Request, Response, NextFunction } from "express";
/**
 * Operational errors that should be sent back to the client.
 * Differentiated from programmer errors (which should crash the process in dev).
 */
export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string);
}
/**
 * Must be mounted LAST in the Express middleware chain (after all routes).
 * Catches both ApiError instances and unexpected programmer errors.
 */
export declare const globalErrorHandler: (err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => void;
/**
 * Mount this AFTER all routes but BEFORE globalErrorHandler.
 * Converts unmatched routes into a proper ApiError.
 */
export declare const notFoundHandler: (req: Request, _res: Response, next: NextFunction) => void;
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
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map