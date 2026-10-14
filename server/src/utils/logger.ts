import pino from 'pino';
import { appConfig } from '../config/env.js';

export const logger = pino({
  level: appConfig.log.level,
  transport: process.env.NODE_ENV === 'production' && appConfig.log.compact
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
      },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'accessToken', 'refreshToken'],
    remove: true,
  },
});

export function withRequestId(req: any, res: any, next: any) {
  req.id = req.id || (res.locals?.requestId as string | undefined) || '';
  next();
}
