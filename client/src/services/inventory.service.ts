import { apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  CompleteProcessingInput,
  CreateProcessingInput,
  ListQuery,
  ProcessedMaterialDTO,
  ProcessingBatchDTO,
  RawInventoryDTO,
} from '@/types';

export const inventoryService = {
  rawList: (query: ListQuery & { status?: string; material?: string }) =>
    apiGet<Paginated<RawInventoryDTO>>('/raw-inventory', { params: query }),

  updateRaw: async (
    id: string,
    input: { status?: string; storageLocation?: string; currentWeight?: number }
  ) =>
    (await apiPatch<{ inventory: RawInventoryDTO }>(`/raw-inventory/${id}`, input)).inventory,

  processingList: (query: ListQuery & { status?: string }) =>
    apiGet<Paginated<ProcessingBatchDTO>>('/processing', { params: query }),

  createProcessing: async (input: CreateProcessingInput) =>
    (await apiPost<{ batch: ProcessingBatchDTO }>('/processing', input)).batch,

  updateProcessing: async (id: string, input: { stage?: string; notes?: string; status?: string }) =>
    (await apiPatch<{ batch: ProcessingBatchDTO }>(`/processing/${id}`, input)).batch,

  completeProcessing: (id: string, input: CompleteProcessingInput) =>
    apiPost<{ batch: ProcessingBatchDTO; processed: ProcessedMaterialDTO }>(
      `/processing/${id}/complete`,
      input
    ),

  processedList: (query: ListQuery & { status?: string }) =>
    apiGet<Paginated<ProcessedMaterialDTO>>('/processed-inventory', { params: query }),
};

import type { Paginated } from '@/types';
