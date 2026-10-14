import { appConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export const outbox: EmailMessage[] = [];

export async function sendEmail(message: EmailMessage): Promise<void> {
  outbox.push(message);
  if (appConfig.email.provider === 'console') {
    logger.info({ to: message.to, subject: message.subject }, 'Email (console provider)');
    return;
  }
  logger.warn(
    { provider: appConfig.email.provider, to: message.to, subject: message.subject },
    'Email provider not configured; message captured on the console only'
  );
}

export function resetOutbox(): void {
  outbox.length = 0;
}
