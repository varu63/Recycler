import mongoose, { Schema } from 'mongoose';
import {
  MaterialCategory,
  MaterialGrade,
  MaterialQuality,
  ProcessedInventoryStatus,
} from '../../../shared/src/enums.js';
import { baseOptions, defineModel, imageSchema } from './base.js';

export interface IProcessedMaterial extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  name: string;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quality: MaterialQuality;
  weight: number;
  availableQuantity: number;
  unit: string;
  batch: mongoose.Types.ObjectId;
  description: string | null;
  images: { url: string; publicId?: string; thumbnailUrl?: string; width?: number; height?: number; format?: string }[];
  status: ProcessedInventoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const processedMaterialSchema = new Schema<IProcessedMaterial>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    grade: { type: String, enum: Object.values(MaterialGrade), required: true },
    quality: { type: String, enum: Object.values(MaterialQuality), required: true },
    weight: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kg', maxlength: 20 },
    batch: { type: Schema.Types.ObjectId, ref: 'ProcessingBatch', required: true },
    description: { type: String, default: null, maxlength: 3000 },
    images: { type: [imageSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(ProcessedInventoryStatus),
      default: ProcessedInventoryStatus.AVAILABLE,
      index: true,
    },
  },
  baseOptions
);

processedMaterialSchema.index({ batch: 1 });
processedMaterialSchema.index({ materialType: 1, status: 1 });

export const ProcessedMaterial = defineModel<IProcessedMaterial>(
  'ProcessedMaterial',
  processedMaterialSchema
);
