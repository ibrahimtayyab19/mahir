import { Router } from "express";
import {
  getProviderProfile,
  updateProviderProfile,
  toggleStatus,
  getNearbyJobs,
  acceptJob,
  getProviderBookings,
  updateJobStatus,
  uploadPhoto,
  getEarnings,
  getProviderMessages,
} from "../controllers/provider.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All provider routes require authentication and the 'provider' role
router.use(authenticate, authorize("provider"));

// ─── Profile ──────────────────────────────────────────────────────────────────

/** GET /api/provider/profile */
router.get("/profile", getProviderProfile);

/** PATCH /api/provider/profile */
router.patch("/profile", updateProviderProfile);

/** PUT /api/provider/profile */
router.put("/profile", updateProviderProfile);

// ─── Presence ─────────────────────────────────────────────────────────────────

/** PUT /api/provider/status — Toggle active/inactive + update location (§8) */
router.put("/status", toggleStatus);

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/** GET /api/provider/jobs — Available jobs near provider location (§8) */
router.get("/jobs", getNearbyJobs);

/** POST /api/provider/accept — Accept a job (§8) */
router.post("/accept", acceptJob);

/** POST /api/provider/jobs/:jobId/accept — Accept a job (alternative path) */
router.post("/jobs/:jobId/accept", acceptJob);

/** PUT /api/provider/job/:id — Update job status (en-route, in-progress, done) (§8) */
router.put("/job/:id", updateJobStatus);

// ─── Photos ───────────────────────────────────────────────────────────────────

/** POST /api/provider/photo — Upload completion photo (§8) */
router.post("/photo", uploadPhoto);

// ─── Bookings ─────────────────────────────────────────────────────────────────

/** GET /api/provider/bookings */
router.get("/bookings", getProviderBookings);

// ─── Earnings ─────────────────────────────────────────────────────────────────

/** GET /api/provider/earnings — Wallet summary (§8) */
router.get("/earnings", getEarnings);

// ─── Messages ─────────────────────────────────────────────────────────────────

/** GET /api/provider/messages — Conversation list (§8) */
router.get("/messages", getProviderMessages);

export default router;
