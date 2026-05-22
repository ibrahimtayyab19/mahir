import { Request, Response } from "express";
/**
 * POST /api/agent/simulate
 * Auth-free hackathon demo endpoint (§14).
 */
export declare const simulateDemo: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/agent/job-intake
 * Full AI pipeline entry point (authenticated).
 * Body: { rawMessage, latitude, longitude }
 */
export declare const jobIntake: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/agent/match
 * Manually triggers provider selection + Quoter for an existing session.
 * Body: { sessionId, jobPostId, providerId }
 */
export declare const matchProviders: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/agent/logs
 * Returns recent AgentLog entries for hackathon judge inspection.
 * Query params: ?limit=20&page=1&fallbackOnly=false
 */
export declare const getAgentLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/agent/logs/:id (§8)
 * Returns a single session detail by sessionId.
 */
export declare const getAgentLogById: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=agent.controller.d.ts.map