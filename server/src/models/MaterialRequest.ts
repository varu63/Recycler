import mongoose, { Schema } from 'mongoose';
import {
  MaterialCategory,
  MaterialRequestStatus,
  PickupPreference,
} from '../../../shared/src/enums.js';
import { baseOptions, defineModel, imageSchema } from './base.js';

export interface IMaterialRequest extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  user: mongoose.Types.ObjectId;
  materialType: MaterialCategory;
  materialName: string;
  description: string;
  approximateWeight: number;
  location: string;
  pickupPreference: PickupPreference;
  expectedPrice: number | null;
  images: {
    url: string;
    publicId?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
  }[];
  status: MaterialRequestStatus;
  rejectionReason: string | null;
  adminNotes: string | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const materialRequestSchema = new Schema<IMaterialRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    materialName: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    approximateWeight: { type: Number, required: true, min: 0.01 },
    location: { type: String, required: true, trim: true, maxlength: 300 },
    pickupPreference: {
      type: String,
      enum: Object.values(PickupPreference),
      required: true,
    },
    expectedPrice: { type: Number, default: null, min: 0 },
    images: { type: [imageSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(MaterialRequestStatus),
      default: MaterialRequestStatus.SUBMITTED,
      index: true,
    },
    rejectionReason: { type: String, default: null },
    adminNotes: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
  },
  baseOptions
);

materialRequestSchema.index({ user: 1, createdAt: -1 });
materialRequestSchema.index({ status: 1, createdAt: -1 });

export const MaterialRequest = defineModel<IMaterialRequest>(
  'MaterialRequest',
  materialRequestSchema
);
