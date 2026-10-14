import mongoose, { Schema } from 'mongoose';
import { MaterialCategory, MaterialGrade, MaterialQuality } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IInspection extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  request: mongoose.Types.ObjectId;
  inspector: mongoose.Types.ObjectId;
  actualWeight: number;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quality: MaterialQuality;
  notes: string | null;
  scheduledAt: Date | null;
  inspectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inspectionSchema = new Schema<IInspection>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'MaterialRequest', required: true },
    inspector: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actualWeight: { type: Number, required: true, min: 0.01 },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    grade: { type: String, enum: Object.values(MaterialGrade), required: true },
    quality: { type: String, enum: Object.values(MaterialQuality), required: true },
    notes: { type: String, default: null, maxlength: 2000 },
    scheduledAt: { type: Date, default: null },
    inspectedAt: { type: Date, required: true },
  },
  baseOptions
);

inspectionSchema.index({ request: 1, createdAt: -1 });
inspectionSchema.index({ inspectedAt: -1 });

export const Inspection = defineModel<IInspection>('Inspection', inspectionSchema);
