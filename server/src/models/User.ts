import mongoose, { Schema } from 'mongoose';
import { Role, UserStatus } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IUser extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  status: UserStatus;
  role: Role;
  avatarUrl: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    password: { type: String, required: true, select: false },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    role: { type: String, enum: Object.values(Role), default: Role.CUSTOMER, index: true },
    avatarUrl: { type: String, default: null },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  baseOptions
);

userSchema.index({ createdAt: -1 });

export const User = defineModel<IUser>('User', userSchema);
