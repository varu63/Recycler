import { z } from 'zod';
import { OrderStatus, PaymentStatus } from '../../../shared/src/enums.js';
import { boolish, createListQuery } from './common.js';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
});

export const createOrderSchema = z.object({
  listingId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format'),
  quantity: z.number().positive(),
  shippingAddress: shippingAddressSchema,
  customerNote: z.string().trim().max(2000).optional(),
});

export const orderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancelReason: z.string().trim().max(2000).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

export const cancelOrderSchema = z.object({
  cancelReason: z.string().trim().max(2000).optional(),
});

export const orderListQuerySchema = createListQuery({
  status: z.nativeEnum(OrderStatus).optional(),
  all: boolish.optional(),
});
