import mongoose, { Schema } from 'mongoose';
import { NotificationType } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface INotification extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  user: mongoose.Types.ObjectId;
  type: NotificationType | string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), default: NotificationType.GENERAL },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  baseOptions
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = defineModel<INotification>('Notification', notificationSchema);
