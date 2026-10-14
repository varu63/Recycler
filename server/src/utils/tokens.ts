import { randomBytes } from 'crypto';

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

import { createHash } from 'crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashTokenAsync(token: string): Promise<string> {
  return hashToken(token);
}
