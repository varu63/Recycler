import mongoose, { Schema } from 'mongoose';
import { baseOptions, defineModel } from './base.js';

export type UploadStorage = 'cloudinary' | 'local';

export interface IUpload extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  user: mongoose.Types.ObjectId;
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  storage: UploadStorage;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema<IUpload>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    publicId: { type: String, required: true, unique: true, trim: true },
    url: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    format: { type: String, trim: true },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    storage: { type: String, enum: ['cloudinary', 'local'], required: true },
  },
  baseOptions
);

uploadSchema.index({ user: 1, createdAt: -1 });

export const Upload = defineModel<IUpload>('Upload', uploadSchema);
