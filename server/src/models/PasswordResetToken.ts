import mongoose, { Schema } from 'mongoose';
import { baseOptions, defineModel } from './base.js';

export interface IPasswordResetToken extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  baseOptions
);

passwordResetTokenSchema.index({ expiresAt: 1 });

export const PasswordResetToken = defineModel<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
