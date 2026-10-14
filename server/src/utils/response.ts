import { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'OK', statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data, message });
}
