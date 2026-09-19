import type { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
/**
 * 404 Not Found handler for undefined API routes.
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Centralized application error handler with Czech user-friendly messages.
 */
export declare function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void;
