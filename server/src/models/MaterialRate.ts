import mongoose, { Schema } from 'mongoose';
import { MaterialCategory } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IMaterialRate extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  materialCategory: MaterialCategory;
  pricePerKg: number;
  currency: string;
  effectiveDate: Date;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const materialRateSchema = new Schema<IMaterialRate>(
  {
    materialCategory: { type: String, enum: Object.values(MaterialCategory), required: true, unique: true },
    pricePerKg: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', maxlength: 3 },
    effectiveDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  baseOptions
);

export const MaterialRate = defineModel<IMaterialRate>('MaterialRate', materialRateSchema);

