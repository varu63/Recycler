import mongoose, { Schema } from 'mongoose';
import { OfferStatus, PaymentMethod } from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IPurchaseOffer extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  request: mongoose.Types.ObjectId;
  verifiedWeight: number;
  pricePerKg: number;
  totalPurchasePrice: number;
  pickupDate: Date;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: OfferStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOfferSchema = new Schema<IPurchaseOffer>(
  {
    request: { type: Schema.Types.ObjectId, ref: 'MaterialRequest', required: true },
    verifiedWeight: { type: Number, required: true, min: 0.01 },
    pricePerKg: { type: Number, required: true, min: 0 },
    totalPurchasePrice: { type: Number, required: true, min: 0 },
    pickupDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    notes: { type: String, default: null, maxlength: 2000 },
    status: { type: String, enum: Object.values(OfferStatus), default: OfferStatus.PENDING, index: true },
    expiresAt: { type: Date, default: null },
  },
  baseOptions
);

purchaseOfferSchema.index({ request: 1, createdAt: -1 });
purchaseOfferSchema.index({ expiresAt: 1 });

export const PurchaseOffer = defineModel<IPurchaseOffer>('PurchaseOffer', purchaseOfferSchema);
