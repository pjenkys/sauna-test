import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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
export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
}

/**
 * Verifies JWT token and attaches user to request. Rejects unauthorized requests with 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Neautorizovaný přístup: Chybí přihlašovací token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Neautorizovaný přístup: Neplatný nebo expirovaný token' });
    return;
  }
}

/**
 * Optional authentication: extracts user if token provided, but does not block if missing/invalid.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      req.user = undefined;
    }
  }
  next();
}

/**
 * Middleware factory to enforce specific user roles (e.g. 'admin', 'moderator', 'partner').
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Neautorizovaný přístup' });
      return;
    }
    if (!roles.includes(req.user.role || 'user')) {
      res.status(403).json({ success: false, error: 'Nedostatečná oprávnění pro tuto akci' });
      return;
    }
    next();
  };
}
