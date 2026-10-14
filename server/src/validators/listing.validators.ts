import { z } from 'zod';
import { UPLOAD_MAX_FILES } from '../../../shared/src/constants.js';
import {
  ListingStatus,
  MaterialCategory,
  MaterialGrade,
  MaterialQuality,
} from '../../../shared/src/enums.js';
import { boolish, createListQuery, objectIdSchema } from './common.js';
import { imageInputSchema } from './material-request.validators.js';

export const createListingSchema = z
  .object({
    processedMaterial: objectIdSchema,
    productName: z.string().trim().min(2).max(150),
    description: z.string().trim().min(5).max(5000),
    pricePerKg: z.number().min(0).max(1_000_000),
    availableQuantity: z.number().positive().max(1_000_000),
    minOrderQuantity: z.number().positive().max(1_000_000),
    images: z.array(imageInputSchema).max(UPLOAD_MAX_FILES).default([]),
    qualityInfo: z
      .object({
        quality: z.nativeEnum(MaterialQuality),
        notes: z.string().trim().max(2000).optional(),
      })
      .optional(),
    publish: z.boolean().optional(),
  })
  .refine((data) => data.minOrderQuantity <= data.availableQuantity, {
    message: 'Minimum order quantity cannot exceed available quantity',
    path: ['minOrderQuantity'],
  });

export const updateListingSchema = z
  .object({
    productName: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(5).max(5000).optional(),
    pricePerKg: z.number().min(0).max(1_000_000).optional(),
    availableQuantity: z.number().min(0).max(1_000_000).optional(),
    minOrderQuantity: z.number().min(0.01).max(1_000_000).optional(),
    images: z.array(imageInputSchema).max(UPLOAD_MAX_FILES).optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    qualityInfo: z
      .object({
        quality: z.nativeEnum(MaterialQuality),
        notes: z.string().trim().max(2000).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'At least one field must be provided' }
  );

export const marketplaceQuerySchema = createListQuery({
  material: z.nativeEnum(MaterialCategory).optional(),
  grade: z.nativeEnum(MaterialGrade).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: boolish.optional(),
});

export const adminListingQuerySchema = createListQuery({
  status: z.nativeEnum(ListingStatus).optional(),
  material: z.nativeEnum(MaterialCategory).optional(),
});
