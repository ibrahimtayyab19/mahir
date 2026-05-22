"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_controller_1 = require("../controllers/agent.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ─── Auth-Free Demo Endpoint (hackathon judges / demo video) ─────────────────
// Must be registered BEFORE router.use(authenticate)
/** POST /api/agent/simulate — Section 14 hardcoded demo scenario (no auth) */
router.post("/simulate", agent_controller_1.simulateDemo);
// ─── Authenticated Agent Endpoints ───────────────────────────────────────────
router.use(auth_middleware_1.authenticate);
/** POST /api/agent/job-intake */
router.post("/job-intake", agent_controller_1.jobIntake);
/** POST /api/agent/match */
router.post("/match", agent_controller_1.matchProviders);
/** GET /api/agent/logs — All sessions (§8) */
router.get("/logs", agent_controller_1.getAgentLogs);
/** GET /api/agent/logs/:id — Single session detail (§8) */
router.get("/logs/:id", agent_controller_1.getAgentLogById);
exports.default = router;
//# sourceMappingURL=agent.routes.js.map