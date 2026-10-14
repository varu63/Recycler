import { apiGet, apiPost, apiPatch } from '@/lib/api';
import type { CreateOrderInput, ListQuery, OrderDTO, Paginated } from '@/types';

export const ordersService = {
  create: async (input: CreateOrderInput) =>
    (await apiPost<{ order: OrderDTO }>('/orders', input)).order,

  list: (query: ListQuery & { status?: string; all?: boolean }) =>
    apiGet<Paginated<OrderDTO>>('/orders', { params: query }),

  get: async (id: string) => (await apiGet<{ order: OrderDTO }>(`/orders/${id}`)).order,

  updateStatus: async (
    id: string,
    input: { status: string; cancelReason?: string; paymentStatus?: string }
  ) => (await apiPatch<{ order: OrderDTO }>(`/orders/${id}/status`, input)).order,

  cancel: async (id: string, cancelReason?: string) =>
    (await apiPost<{ order: OrderDTO }>(`/orders/${id}/cancel`, { cancelReason })).order,
};
