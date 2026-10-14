import { apiGet, apiPost } from '@/lib/api';
import type {
  CreateMaterialRequestInput,
  CreateOfferInput,
  InspectionDTO,
  ListQuery,
  MaterialRequestDTO,
  Paginated,
  PurchaseOfferDTO,
} from '@/types';

type RequestResponse = { request: MaterialRequestDTO };

export const requestsService = {
  list: (query: ListQuery & { status?: string }) =>
    apiGet<Paginated<MaterialRequestDTO>>('/material-requests', { params: query }),

  get: async (id: string) => (await apiGet<RequestResponse>(`/material-requests/${id}`)).request,

  create: async (input: CreateMaterialRequestInput) =>
    (await apiPost<RequestResponse>('/material-requests', input)).request,

  review: async (id: string) =>
    (await apiPost<RequestResponse>(`/material-requests/${id}/review`)).request,

  scheduleInspection: async (id: string, scheduledAt: string) =>
    (await apiPost<RequestResponse>(`/material-requests/${id}/schedule-inspection`, { scheduledAt }))
      .request,

  createInspection: async (id: string, input: unknown) =>
    (await apiPost<{ inspection: InspectionDTO }>(`/material-requests/${id}/inspection`, input))
      .inspection,

  createOffer: async (id: string, input: CreateOfferInput) =>
    (await apiPost<{ offer: PurchaseOfferDTO }>(`/material-requests/${id}/offer`, input)).offer,

  acceptOffer: (id: string) =>
    apiPost<{ request: MaterialRequestDTO; offer: PurchaseOfferDTO }>(
      `/material-requests/${id}/accept-offer`
    ),

  rejectOffer: (id: string) =>
    apiPost<{ request: MaterialRequestDTO; offer: PurchaseOfferDTO }>(
      `/material-requests/${id}/reject-offer`
    ),

  purchase: async (id: string) =>
    (await apiPost<RequestResponse>(`/material-requests/${id}/purchase`)).request,

  complete: async (id: string) =>
    (await apiPost<RequestResponse>(`/material-requests/${id}/complete`)).request,

  reject: async (id: string, reason: string) =>
    (await apiPost<RequestResponse>(`/material-requests/${id}/reject`, { reason })).request,
};

export const offersService = {
  list: (query: ListQuery & { status?: string }) =>
    apiGet<Paginated<PurchaseOfferDTO>>('/offers', { params: query }),
};

export const inspectionsService = {
  list: (query: ListQuery & { requestId?: string }) =>
    apiGet<Paginated<InspectionDTO>>('/inspections', { params: query }),
};
