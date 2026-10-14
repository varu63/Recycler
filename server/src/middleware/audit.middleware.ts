import type { Request } from 'express';
import { AuditAction } from '../../../shared/src/enums.js';
import { AuditLog } from '../models/index.js';
import { logger } from '../utils/logger.js';

export interface AuditInput {
  actor?: string | null;
  action: AuditAction | string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function clientIp(req: Request): string | null {
  return req.ip || req.socket?.remoteAddress || null;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await AuditLog.create({
      actor: input.actor ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      ip: input.ip ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to write audit log');
  }
}

export function auditFromRequest(
  req: Request,
  action: AuditAction | string,
  entity: string,
  entityId?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  return recordAudit({
    actor: req.user ? String(req.user._id) : null,
    action,
    entity,
    entityId: entityId ?? null,
    ip: clientIp(req),
    metadata: metadata ?? null,
  });
}
