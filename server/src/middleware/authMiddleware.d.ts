import type { Request, Response, NextFunction } from 'express';
export interface AuthUserPayload {
    id: string;
    email: string;
    role?: string;
    display_name?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthUserPayload;
        }
    }
}
/**
 * Generates a signed JWT token for the given payload.
 */
export declare function generateToken(payload: AuthUserPayload): string;
/**
 * Verifies JWT token and attaches user to request. Rejects unauthorized requests with 401.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional authentication: extracts user if token provided, but does not block if missing/invalid.
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
/**
 * Middleware factory to enforce specific user roles (e.g. 'admin', 'moderator', 'partner').
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
