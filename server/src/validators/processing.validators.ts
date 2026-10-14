import { z } from 'zod';
import {
  MaterialCategory,
  MaterialGrade,
  ProcessedInventoryStatus,
  ProcessingStage,
  ProcessingStatus,
  RawInventoryStatus,
} from '../../../shared/src/enums.js';
import { createListQuery, objectIdSchema } from './common.js';

export const createProcessingSchema = z.object({
  rawInventory: objectIdSchema,
  processingType: z.string().trim().min(2).max(120),
  inputWeight: z.number().positive().max(1_000_000),
  notes: z.string().trim().max(2000).optional(),
});

export const updateProcessingSchema = z
  .object({
    stage: z.nativeEnum(ProcessingStage).optional(),
    status: z.nativeEnum(ProcessingStatus).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) =>
      data.stage !== undefined || data.status !== undefined || data.notes !== undefined,
    { message: 'At least one field must be provided' }
  );

export const completeProcessingSchema = z.object({
  outputWeight: z.number().min(0).max(1_000_000),
  stage: z.nativeEnum(ProcessingStage).optional(),
  qualityGrade: z.nativeEnum(MaterialGrade).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const processingListQuerySchema = createListQuery({
  status: z.nativeEnum(ProcessingStatus).optional(),
});

export const rawInventoryListQuerySchema = createListQuery({
  status: z.nativeEnum(RawInventoryStatus).optional(),
  material: z.nativeEnum(MaterialCategory).optional(),
});

export const updateRawInventorySchema = z
  .object({
    status: z.nativeEnum(RawInventoryStatus).optional(),
    storageLocation: z.string().trim().min(2).max(200).optional(),
    currentWeight: z.number().min(0).max(1_000_000).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined || data.storageLocation !== undefined || data.currentWeight !== undefined,
    { message: 'At least one field must be provided' }
  );

export const processedListQuerySchema = createListQuery({
  status: z.nativeEnum(ProcessedInventoryStatus).optional(),
});
