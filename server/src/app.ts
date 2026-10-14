import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { appConfig } from './config/env.js';
import { createApiRateLimit } from './middleware/rate-limit.middleware.js';
import { createApiRouter } from './routes/index.js';
import { errorHandler } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  const allowedOrigins = appConfig.clientUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), appConfig.localUploadDir), {
      dotfiles: 'deny',
      index: false,
      maxAge: '1d',
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, message: 'OK' });
  });

  app.use('/api', createApiRateLimit());
  app.use('/api', createApiRouter());

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND' });
  });
  app.use(errorHandler);

  return app;
}
