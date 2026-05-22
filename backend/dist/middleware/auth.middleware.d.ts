import { Request, Response, NextFunction } from "express";
export interface JwtPayload {
    userId: string;
    role: "client" | "provider";
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
/**
 * Verifies the JWT access token from the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 */
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Role-based access guard. Must be used AFTER authenticate().
 *
 * @example
 * router.get("/provider-only", authenticate, authorize("provider"), handler);
 */
export declare const authorize: (...roles: Array<"client" | "provider">) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map