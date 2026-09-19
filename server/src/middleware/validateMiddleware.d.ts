import type { Request, Response, NextFunction } from 'express';
/**
 * Validates that all required fields are present and non-empty in request body.
 */
export declare function validateBody(requiredFields: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Simple email format validator.
 */
export declare function isValidEmail(email: string): boolean;
