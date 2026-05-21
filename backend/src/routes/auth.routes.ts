import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

/** POST /api/auth/register */
router.post("/register", register);

/** POST /api/auth/login */
router.post("/login", login);

/** POST /api/auth/google — Simulated Google OAuth (§8) */
router.post("/google", register); // Reuse register logic for hackathon

// ─── Protected Routes ─────────────────────────────────────────────────────────

/** GET /api/auth/me */
router.get("/me", authenticate, getMe);

export default router;
