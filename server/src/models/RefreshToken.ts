import mongoose, { Schema } from 'mongoose';
import { baseOptions, defineModel } from './base.js';

export interface IRefreshToken extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  baseOptions
);

refreshTokenSchema.index({ user: 1, revoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

export const RefreshToken = defineModel<IRefreshToken>('RefreshToken', refreshTokenSchema);
