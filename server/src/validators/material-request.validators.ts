import { z } from 'zod';
import { UPLOAD_MAX_FILES } from '../../../shared/src/constants.js';
import { MaterialCategory, MaterialRequestStatus, PickupPreference } from '../../../shared/src/enums.js';
import { createListQuery, dateInput } from './common.js';

export const imageInputSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  publicId: z.string().max(300).optional(),
  thumbnailUrl: z.string().max(2048).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().max(20).optional(),
  bytes: z.number().int().nonnegative().optional(),
});

export const createMaterialRequestSchema = z.object({
  materialType: z.nativeEnum(MaterialCategory),
  materialName: z.string().trim().min(2).max(150),
  description: z.string().trim().min(5).max(3000),
  approximateWeight: z.number().positive().max(1_000_000),
  location: z.string().trim().min(3).max(300),
  pickupPreference: z.nativeEnum(PickupPreference),
  expectedPrice: z.number().min(0).max(1_000_000).optional(),
  images: z.array(imageInputSchema).max(UPLOAD_MAX_FILES).default([]),
});

export const materialRequestListQuerySchema = createListQuery({
  status: z.nativeEnum(MaterialRequestStatus).optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().trim().min(3, 'A rejection reason is required').max(2000),
});

export const scheduleInspectionSchema = z.object({
  scheduledAt: dateInput,
});

export const adminNotesSchema = z.object({
  adminNotes: z.string().trim().min(1).max(2000),
});
