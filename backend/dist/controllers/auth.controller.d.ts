import { Request, Response } from "express";
/**
 * POST /api/auth/register
 * Body: { name, email, password, role, phone? }
 * Creates a User document. If role === "provider", also creates a Provider profile.
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Protected by authenticate middleware.
 */
export declare const getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map