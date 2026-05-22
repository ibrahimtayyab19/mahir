"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_controller_1 = require("../controllers/provider.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All provider routes require authentication and the 'provider' role
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("provider"));
// ─── Profile ──────────────────────────────────────────────────────────────────
/** GET /api/provider/profile */
router.get("/profile", provider_controller_1.getProviderProfile);
/** PATCH /api/provider/profile */
router.patch("/profile", provider_controller_1.updateProviderProfile);
/** PUT /api/provider/profile */
router.put("/profile", provider_controller_1.updateProviderProfile);
// ─── Presence ─────────────────────────────────────────────────────────────────
/** PUT /api/provider/status — Toggle active/inactive + update location (§8) */
router.put("/status", provider_controller_1.toggleStatus);
// ─── Jobs ─────────────────────────────────────────────────────────────────────
/** GET /api/provider/jobs — Available jobs near provider location (§8) */
router.get("/jobs", provider_controller_1.getNearbyJobs);
/** POST /api/provider/accept — Accept a job (§8) */
router.post("/accept", provider_controller_1.acceptJob);
/** POST /api/provider/jobs/:jobId/accept — Accept a job (alternative path) */
router.post("/jobs/:jobId/accept", provider_controller_1.acceptJob);
/** PUT /api/provider/job/:id — Update job status (en-route, in-progress, done) (§8) */
router.put("/job/:id", provider_controller_1.updateJobStatus);
// ─── Photos ───────────────────────────────────────────────────────────────────
/** POST /api/provider/photo — Upload completion photo (§8) */
router.post("/photo", provider_controller_1.uploadPhoto);
// ─── Bookings ─────────────────────────────────────────────────────────────────
/** GET /api/provider/bookings */
router.get("/bookings", provider_controller_1.getProviderBookings);
// ─── Earnings ─────────────────────────────────────────────────────────────────
/** GET /api/provider/earnings — Wallet summary (§8) */
router.get("/earnings", provider_controller_1.getEarnings);
// ─── Messages ─────────────────────────────────────────────────────────────────
/** GET /api/provider/messages — Conversation list (§8) */
router.get("/messages", provider_controller_1.getProviderMessages);
// ─── AI Agent ─────────────────────────────────────────────────────────────────
/** POST /api/provider/chat — Conversational agent */
router.post("/chat", provider_controller_1.chatWithAgent);
exports.default = router;
//# sourceMappingURL=provider.routes.js.map