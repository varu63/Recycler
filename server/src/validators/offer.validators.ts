import { z } from 'zod';
import { OfferStatus, PaymentMethod } from '../../../shared/src/enums.js';
import { createListQuery, dateInput } from './common.js';

export const createOfferSchema = z.object({
  verifiedWeight: z.number().positive().max(1_000_000),
  pricePerKg: z.number().min(0).max(1_000_000),
  pickupDate: dateInput,
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().trim().max(2000).optional(),
});

export const offerListQuerySchema = createListQuery({
  status: z.nativeEnum(OfferStatus).optional(),
});
