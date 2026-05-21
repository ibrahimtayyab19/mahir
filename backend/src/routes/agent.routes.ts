import { Router } from "express";
import {
  jobIntake,
  matchProviders,
  getAgentLogs,
  getAgentLogById,
  simulateDemo,
} from "../controllers/agent.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ─── Auth-Free Demo Endpoint (hackathon judges / demo video) ─────────────────
// Must be registered BEFORE router.use(authenticate)

/** POST /api/agent/simulate — Section 14 hardcoded demo scenario (no auth) */
router.post("/simulate", simulateDemo);

// ─── Authenticated Agent Endpoints ───────────────────────────────────────────

router.use(authenticate);

/** POST /api/agent/job-intake */
router.post("/job-intake", jobIntake);

/** POST /api/agent/match */
router.post("/match", matchProviders);

/** GET /api/agent/logs — All sessions (§8) */
router.get("/logs", getAgentLogs);

/** GET /api/agent/logs/:id — Single session detail (§8) */
router.get("/logs/:id", getAgentLogById);

export default router;
