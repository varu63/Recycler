import mongoose, { Schema } from 'mongoose';
import { MaterialCategory, RawInventoryStatus } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IRawInventory extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  materialType: MaterialCategory;
  materialName: string;
  sourceUser: mongoose.Types.ObjectId;
  purchaseRequest: mongoose.Types.ObjectId;
  purchaseOffer: mongoose.Types.ObjectId;
  purchaseWeight: number;
  currentWeight: number;
  pricePerKg: number;
  purchasePrice: number;
  receivedDate: Date;
  storageLocation: string;
  status: RawInventoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const rawInventorySchema = new Schema<IRawInventory>(
  {
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    materialName: { type: String, required: true, trim: true, maxlength: 150 },
    sourceUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purchaseRequest: { type: Schema.Types.ObjectId, ref: 'MaterialRequest', required: true },
    purchaseOffer: { type: Schema.Types.ObjectId, ref: 'PurchaseOffer', required: true },
    purchaseWeight: { type: Number, required: true, min: 0.01 },
    currentWeight: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    receivedDate: { type: Date, required: true },
    storageLocation: { type: String, default: 'Main Warehouse', maxlength: 200 },
    status: {
      type: String,
      enum: Object.values(RawInventoryStatus),
      default: RawInventoryStatus.PURCHASED,
      index: true,
    },
  },
  baseOptions
);

rawInventorySchema.index({ status: 1, createdAt: -1 });
rawInventorySchema.index({ materialType: 1 });
rawInventorySchema.index({ sourceUser: 1 });

export const RawInventory = defineModel<IRawInventory>('RawInventory', rawInventorySchema);
