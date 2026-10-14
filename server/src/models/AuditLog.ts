import mongoose, { Schema } from 'mongoose';
import { AuditAction } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IAuditLog extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  actor: mongoose.Types.ObjectId | null;
  action: AuditAction | string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    entity: { type: String, required: true, maxlength: 100, index: true },
    entityId: { type: String, default: null, index: true },
    ip: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { ...baseOptions, immutable: true }
);

auditLogSchema.index({ entity: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = defineModel<IAuditLog>('AuditLog', auditLogSchema);
