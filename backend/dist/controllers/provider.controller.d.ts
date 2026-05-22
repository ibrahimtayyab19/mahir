import { Request, Response } from "express";
/**
 * GET /api/provider/profile
 */
export declare const getProviderProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * PATCH /api/provider/profile
 * Body: { skills?, bio?, serviceCategory?, latitude?, longitude? }
 */
export declare const updateProviderProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * PUT /api/provider/status (§8)
 * Toggle provider online/offline status and update live location.
 * Body: { isActive, latitude, longitude }
 */
export declare const toggleStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/provider/jobs
 * Available jobs near the provider (§8). Uses $geoNear.
 * Query params: ?lat=&lng=&radiusKm=&category=&limit=
 */
export declare const getNearbyJobs: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/provider/accept (§8)
 * Provider accepts an assigned (matched/open) job, creating a pending Booking.
 * Body: { agreedPricePKR, scheduledAt }
 */
export declare const acceptJob: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/provider/bookings
 */
export declare const getProviderBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * PUT /api/provider/job/:id (§8)
 * Update job status (en-route, in-progress, done).
 * Body: { status: "en-route"|"in-progress"|"completed"|"cancelled", note? }
 */
export declare const updateJobStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/provider/photo (§8)
 * Upload completion photo URL. Body: { bookingId, photoUrl }
 */
export declare const uploadPhoto: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/provider/earnings (§8)
 * Wallet summary for the provider dashboard.
 */
export declare const getEarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/provider/stats
 * Alias for earnings (backward compat).
 */
export declare const getProviderStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/provider/messages (§8)
 * Conversation list for the provider.
 */
export declare const getProviderMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/provider/chat
 * Conversational AI agent for providers.
 * Body: { message: string }
 */
export declare const chatWithAgent: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=provider.controller.d.ts.map