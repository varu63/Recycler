import mongoose, { Schema } from 'mongoose';
import {
  ListingStatus,
  MaterialCategory,
  MaterialGrade,
  MaterialQuality,
} from '../../../shared/src/enums.js';
import { baseOptions, defineModel, imageSchema } from './base.js';

export interface IListing extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  productName: string;
  materialType: MaterialCategory;
  materialName: string;
  grade: MaterialGrade;
  description: string;
  pricePerKg: number;
  availableQuantity: number;
  minOrderQuantity: number;
  images: { url: string; publicId?: string; thumbnailUrl?: string; width?: number; height?: number; format?: string }[];
  qualityInfo: { quality: MaterialQuality; notes?: string; verified: boolean };
  status: ListingStatus;
  processedMaterial: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceListingSchema = new Schema<IListing>(
  {
    productName: { type: String, required: true, trim: true, maxlength: 150 },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    materialName: { type: String, required: true, trim: true, maxlength: 150 },
    grade: { type: String, enum: Object.values(MaterialGrade), required: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    pricePerKg: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    minOrderQuantity: { type: Number, required: true, min: 0.01 },
    images: { type: [imageSchema], default: [] },
    qualityInfo: {
      type: new Schema(
        {
          quality: { type: String, enum: Object.values(MaterialQuality), required: true },
          notes: { type: String, maxlength: 2000 },
          verified: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ListingStatus),
      default: ListingStatus.DRAFT,
      index: true,
    },
    processedMaterial: {
      type: Schema.Types.ObjectId,
      ref: 'ProcessedMaterial',
      required: true,
      index: true,
    },
  },
  baseOptions
);

marketplaceListingSchema.index({ status: 1, createdAt: -1 });
marketplaceListingSchema.index({ status: 1, pricePerKg: 1 });
marketplaceListingSchema.index({ materialType: 1, grade: 1 });

export const MarketplaceListing = defineModel<IListing>(
  'MarketplaceListing',
  marketplaceListingSchema
);
