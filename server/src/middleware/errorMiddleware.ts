import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 404 Not Found handler for undefined API routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Požadovaný koncový bod nebyl nalezen: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralized application error handler with Czech user-friendly messages.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  // SQLite constraint error translation to user-friendly Czech
  let message = err.message || 'Nastala neočekávaná chyba serveru';
  if (err.code === 'ERR_SQLITE_ERROR' || err.errcode) {
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
      message = 'Neplatná reference: odkazovaný záznam neexistuje';
    } else if (err.message && err.message.includes('UNIQUE constraint failed')) {
      message = 'Záznam s těmito unikátními údaji již existuje';
    }
  }

  // Prevent leaking stack trace in production
  const responsePayload: Record<string, any> = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    responsePayload.stack = err.stack;
  }

  if (err.details) {
    responsePayload.details = err.details;
  }

  res.status(statusCode).json(responsePayload);
}
