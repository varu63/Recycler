import { apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  CreateListingInput,
  ListQuery,
  MarketplaceListingDTO,
  MaterialProvenanceDTO,
  Paginated,
} from '@/types';

export const marketplaceService = {
  listPublic: (query: {
    q?: string;
    material?: string;
    grade?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) => apiGet<Paginated<MarketplaceListingDTO>>('/marketplace', { params: query }),

  getPublic: async (id: string) =>
    (await apiGet<{ listing: MarketplaceListingDTO }>(`/marketplace/${id}`)).listing,

  getProvenance: async (id: string) =>
    (await apiGet<{ provenance: MaterialProvenanceDTO }>(`/marketplace/${id}/provenance`)).provenance,

  adminList: (query: ListQuery & { status?: string; material?: string }) =>
    apiGet<Paginated<MarketplaceListingDTO>>('/marketplace/admin', { params: query }),

  create: async (input: CreateListingInput & { publish?: boolean }) =>
    (await apiPost<{ listing: MarketplaceListingDTO }>('/marketplace', input)).listing,

  update: async (
    id: string,
    input: Partial<{
      productName: string;
      description: string;
      pricePerKg: number;
      availableQuantity: number;
      minOrderQuantity: number;
      status: string;
      images: MarketplaceListingDTO['images'];
    }>
  ) => (await apiPatch<{ listing: MarketplaceListingDTO }>(`/marketplace/${id}`, input)).listing,
};
