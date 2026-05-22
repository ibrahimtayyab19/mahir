"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All client routes require authentication and the 'client' role
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("client"));
// ─── AI Agent Flow (Phase 5) ─────────────────────────────────────────────────
/** POST /api/client/request — AI-powered job intake (Parser + Matchmaker) */
router.post("/request", client_controller_1.requestJob);
/** POST /api/client/select — Provider selection (Quoter + Booking) */
router.post("/select", client_controller_1.selectProvider);
// ─── Standard Jobs ────────────────────────────────────────────────────────────
/** POST /api/client/jobs — Manual job creation (backward compat) */
router.post("/jobs", client_controller_1.createJob);
/** GET /api/client/jobs */
router.get("/jobs", client_controller_1.getMyJobs);
// ─── Bookings ─────────────────────────────────────────────────────────────────
/** GET /api/client/bookings */
router.get("/bookings", client_controller_1.getMyBookings);
/** GET /api/client/bookings/:id */
router.get("/bookings/:id", client_controller_1.getBookingById);
/** POST /api/client/rate — Submit rating after job (§8) */
router.post("/rate", client_controller_1.rateProvider);
// ─── Messages ─────────────────────────────────────────────────────────────────
/** GET /api/client/messages — Conversation list (§8) */
router.get("/messages", client_controller_1.getClientMessages);
exports.default = router;
//# sourceMappingURL=client.routes.js.map