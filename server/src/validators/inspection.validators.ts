import { z } from 'zod';
import { MaterialCategory, MaterialGrade, MaterialQuality } from '../../../shared/src/enums.js';
import { createListQuery } from './common.js';

export const createInspectionSchema = z.object({
  actualWeight: z.number().positive().max(1_000_000),
  materialType: z.nativeEnum(MaterialCategory),
  grade: z.nativeEnum(MaterialGrade),
  quality: z.nativeEnum(MaterialQuality),
  notes: z.string().trim().max(2000).optional(),
});

export const inspectionListQuerySchema = createListQuery({
  requestId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format').optional(),
});
