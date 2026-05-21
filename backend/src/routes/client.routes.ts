import { Router } from "express";
import {
  requestJob,
  selectProvider,
  createJob,
  getMyJobs,
  getMyBookings,
  getBookingById,
  rateProvider,
  getClientMessages,
} from "../controllers/client.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All client routes require authentication and the 'client' role
router.use(authenticate, authorize("client"));

// ─── AI Agent Flow (Phase 5) ─────────────────────────────────────────────────

/** POST /api/client/request — AI-powered job intake (Parser + Matchmaker) */
router.post("/request", requestJob);

/** POST /api/client/select — Provider selection (Quoter + Booking) */
router.post("/select", selectProvider);

// ─── Standard Jobs ────────────────────────────────────────────────────────────

/** POST /api/client/jobs — Manual job creation (backward compat) */
router.post("/jobs", createJob);

/** GET /api/client/jobs */
router.get("/jobs", getMyJobs);

// ─── Bookings ─────────────────────────────────────────────────────────────────

/** GET /api/client/bookings */
router.get("/bookings", getMyBookings);

/** GET /api/client/bookings/:id */
router.get("/bookings/:id", getBookingById);

/** POST /api/client/rate — Submit rating after job (§8) */
router.post("/rate", rateProvider);

// ─── Messages ─────────────────────────────────────────────────────────────────

/** GET /api/client/messages — Conversation list (§8) */
router.get("/messages", getClientMessages);

export default router;
