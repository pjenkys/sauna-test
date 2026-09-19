import type { Request, Response, NextFunction } from 'express';

/**
 * Validates that all required fields are present and non-empty in request body.
 */
export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of requiredFields) {
      const val = req.body?.[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `Chybí povinná pole: ${missing.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Simple email format validator.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
