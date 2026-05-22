import { Request, Response } from "express";
/**
 * POST /api/client/request
 * AI-powered job intake.
 * Body: { rawMessage, latitude, longitude }
 */
export declare const requestJob: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/client/select
 * Client selects a specific provider from the matches.
 * Body: { sessionId, jobPostId, providerId }
 */
export declare const selectProvider: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/client/jobs
 * Standard (non-AI) job creation — kept for backward compatibility.
 */
export declare const createJob: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/client/jobs
 * Returns all job posts created by the authenticated client.
 */
export declare const getMyJobs: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/client/bookings
 * Returns all bookings for the authenticated client, with full provider + job details.
 */
export declare const getMyBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/client/bookings/:id
 * Returns a single booking by ID — client must own it.
 */
export declare const getBookingById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/client/rate
 * Submit a rating and optional review after job completion (§8).
 * Body: { bookingId, rating, review? }
 */
export declare const rateProvider: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/client/messages
 * Returns conversation list for the authenticated client (§8).
 */
export declare const getClientMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=client.controller.d.ts.map