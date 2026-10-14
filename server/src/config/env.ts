import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  IMAGE_STORAGE: z.enum(['cloudinary', 'local']).default('cloudinary'),
  LOCAL_UPLOAD_DIR: z.string().default('uploads'),
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('Material Mundi <no-reply@materialmundi.com>'),
  EMAIL_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),
  UPLOAD_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().default(30),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().default(30),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  COMPACT_LOGS: z.coerce.boolean().default(process.env.NODE_ENV === 'production'),
});

const config = envSchema.parse(process.env);

export const appConfig = {
  env: config.NODE_ENV,
  port: config.PORT,
  isProd: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
  mongo: { uri: config.MONGO_URI },
  jwt: {
    accessSecret: config.JWT_ACCESS_SECRET,
    refreshSecret: config.JWT_REFRESH_SECRET,
    accessExpiresIn: config.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  },
  passwordResetExpiresMinutes: config.PASSWORD_RESET_EXPIRES_MINUTES,
  clientUrl: config.CLIENT_URL,
  cookies: {
    domain: config.COOKIE_DOMAIN,
    sameSite: config.COOKIE_SAMESITE,
    secure: config.NODE_ENV === 'production',
  },
  cloudinary: {
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    apiSecret: config.CLOUDINARY_API_SECRET,
  },
  imageStorage: config.IMAGE_STORAGE,
  localUploadDir: config.LOCAL_UPLOAD_DIR,
  email: {
    provider: config.EMAIL_PROVIDER,
    from: config.EMAIL_FROM,
    apiKey: config.EMAIL_API_KEY,
    smtp: {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  },
  rateLimit: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    loginMax: config.LOGIN_RATE_LIMIT_MAX,
    uploadWindowMs: config.UPLOAD_RATE_LIMIT_WINDOW_MS,
    uploadMax: config.UPLOAD_RATE_LIMIT_MAX,
  },
  log: {
    level: config.LOG_LEVEL,
    compact: config.COMPACT_LOGS,
  },
} as const;

export type AppConfig = typeof appConfig;

export function isProduction(): boolean {
  return appConfig.isProd;
}
