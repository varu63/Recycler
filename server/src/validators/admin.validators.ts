import { z } from 'zod';
import { Role, UserStatus } from '../../../shared/src/enums.js';
import { createListQuery } from './common.js';

export const userListQuerySchema = createListQuery({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const userStatusSchema = z
  .object({
    status: z.nativeEnum(UserStatus),
  })
  .refine((data) => data.status === UserStatus.ACTIVE || data.status === UserStatus.SUSPENDED, {
    message: 'Status must be active or suspended',
    path: ['status'],
  });

export const auditLogQuerySchema = createListQuery({
  entity: z.string().trim().max(100).optional(),
  action: z.string().trim().max(100).optional(),
});
