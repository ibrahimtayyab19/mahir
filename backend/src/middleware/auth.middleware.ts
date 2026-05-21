import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "./error.middleware";

// ─── JWT Payload Shape ────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  role: "client" | "provider";
  iat?: number;
  exp?: number;
}

// ─── Extend Express Request ───────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Verifies the JWT access token from the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "No token provided"));
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env["JWT_SECRET"];

  if (!secret) {
    return next(new ApiError(500, "JWT_SECRET is not configured on the server"));
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? "Token has expired"
        : "Invalid token";
    next(new ApiError(401, message));
  }
};

/**
 * Role-based access guard. Must be used AFTER authenticate().
 *
 * @example
 * router.get("/provider-only", authenticate, authorize("provider"), handler);
 */
export const authorize =
  (...roles: Array<"client" | "provider">) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Required role(s): ${roles.join(", ")}`
        )
      );
    }

    next();
  };
