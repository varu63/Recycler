import mongoose, { Schema } from 'mongoose';
import {
  MaterialCategory,
  MaterialGrade,
  ProcessingStage,
  ProcessingStatus,
} from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IProcessingBatch extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  batchId: string;
  rawInventory: mongoose.Types.ObjectId;
  materialType: MaterialCategory;
  materialName: string;
  processingType: string;
  stage: ProcessingStage;
  status: ProcessingStatus;
  inputWeight: number;
  outputWeight: number | null;
  lossWeight: number | null;
  recoveryPercentage: number | null;
  qualityGrade: MaterialGrade | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const processingBatchSchema = new Schema<IProcessingBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    rawInventory: { type: Schema.Types.ObjectId, ref: 'RawInventory', required: true },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    materialName: { type: String, required: true, trim: true, maxlength: 150 },
    processingType: { type: String, required: true, trim: true, maxlength: 120 },
    stage: {
      type: String,
      enum: Object.values(ProcessingStage),
      default: ProcessingStage.SORTING,
    },
    status: {
      type: String,
      enum: Object.values(ProcessingStatus),
      default: ProcessingStatus.PENDING,
      index: true,
    },
    inputWeight: { type: Number, required: true, min: 0.01 },
    outputWeight: { type: Number, default: null, min: 0 },
    lossWeight: { type: Number, default: null, min: 0 },
    recoveryPercentage: { type: Number, default: null, min: 0 },
    qualityGrade: { type: String, enum: [...Object.values(MaterialGrade), null], default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: null, maxlength: 2000 },
  },
  baseOptions
);

processingBatchSchema.index({ status: 1, createdAt: -1 });
processingBatchSchema.index({ rawInventory: 1 });

export const ProcessingBatch = defineModel<IProcessingBatch>(
  'ProcessingBatch',
  processingBatchSchema
);
