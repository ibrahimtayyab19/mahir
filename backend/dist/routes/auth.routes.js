"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ─── Public Routes ────────────────────────────────────────────────────────────
/** POST /api/auth/register */
router.post("/register", auth_controller_1.register);
/** POST /api/auth/login */
router.post("/login", auth_controller_1.login);
/** POST /api/auth/google — Simulated Google OAuth (§8) */
router.post("/google", auth_controller_1.register); // Reuse register logic for hackathon
// ─── Protected Routes ─────────────────────────────────────────────────────────
/** GET /api/auth/me */
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map