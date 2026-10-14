import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export function badRequest(message: string, code = 'VALIDATION_ERROR', details?: Record<string, unknown>): AppError {
  return new AppError(message, 400, code, details);
}

export function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
  return new AppError(message, 401, code);
}

export function forbidden(message = 'Forbidden', code = 'FORBIDDEN'): AppError {
  return new AppError(message, 403, code);
}

export function notFound(message = 'Resource not found', code = 'NOT_FOUND'): AppError {
  return new AppError(message, 404, code);
}

export function conflict(message: string, code = 'CONFLICT'): AppError {
  return new AppError(message, 409, code);
}

export function rateLimited(message = 'Too many requests, please try again later.', code = 'RATE_LIMITED'): AppError {
  return new AppError(message, 429, code);
}

export function badGateway(message = 'Upstream service error', code = 'UPSTREAM_ERROR'): AppError {
  return new AppError(message, 502, code);
}

export function serviceUnavailable(
  message = 'Service temporarily unavailable, please try again later.',
  code = 'SERVICE_UNAVAILABLE'
): AppError {
  return new AppError(message, 503, code);
}

export function invalidState(message: string, code = 'INVALID_STATE_TRANSITION'): AppError {
  return new AppError(message, 409, code);
}

export function insufficientInventory(message: string, code = 'INSUFFICIENT_INVENTORY'): AppError {
  return new AppError(message, 409, code);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let errors: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    const details = err.details as { errors?: Record<string, string[]> } | undefined;
    if (details && details.errors && typeof details.errors === 'object') {
      errors = details.errors;
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    const flat = err.flatten().fieldErrors as Record<string, string[] | undefined>;
    errors = Object.fromEntries(
      Object.entries(flat).filter(([_, v]) => Array.isArray(v)) as [string, string[]][]
    ) as Record<string, string[]>;
  } else if (isMongooseDuplicateKey(err)) {
    statusCode = 409;
    message = 'A record with that value already exists';
    code = 'CONFLICT';
  } else if (isMongooseValidationError(err)) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    const validationErrors = (err as { errors?: Record<string, { message?: string }> }).errors;
    errors = validationErrors
      ? Object.fromEntries(
          Object.entries(validationErrors).map(([field, e]) => [
            field,
            [String(e?.message ?? 'Invalid value')],
          ])
        )
      : undefined;
  } else if (isBodyParserError(err)) {
    statusCode = 400;
    message = 'Invalid JSON payload';
    code = 'VALIDATION_ERROR';
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  const body: any = { success: false, message, code };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

function isMongooseDuplicateKey(err: any): boolean {
  return Boolean(err && typeof err === 'object' && err.code === 11000);
}

function isMongooseValidationError(err: any): boolean {
  return Boolean(err && err.name === 'ValidationError' && typeof err.errors === 'object');
}

function isBodyParserError(err: any): boolean {
  return Boolean(
    err &&
      typeof err.status === 'number' &&
      err.status === 400 &&
      err instanceof SyntaxError
  );
}
