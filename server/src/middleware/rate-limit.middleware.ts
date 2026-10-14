import { rateLimit } from 'express-rate-limit';
import { appConfig } from '../config/env.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function jsonLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message, code: 'RATE_LIMITED' });
    },
  });
}

export function createApiRateLimit() {
  return jsonLimiter(
    appConfig.rateLimit.windowMs,
    appConfig.rateLimit.max,
    'Too many requests, please try again later.'
  );
}

export function createLoginRateLimit() {
  return jsonLimiter(
    FIFTEEN_MINUTES,
    appConfig.rateLimit.loginMax,
    'Too many login attempts. Please try again later.'
  );
}

export function createRegisterRateLimit() {
  return jsonLimiter(ONE_HOUR, 10, 'Too many accounts created. Please try again later.');
}

export function createForgotRateLimit() {
  return jsonLimiter(FIFTEEN_MINUTES, 5, 'Too many password reset requests. Please try again later.');
}

export function createUploadRateLimit() {
  return jsonLimiter(
    appConfig.rateLimit.uploadWindowMs,
    appConfig.rateLimit.uploadMax,
    'Too many uploads, please try again later.'
  );
}
