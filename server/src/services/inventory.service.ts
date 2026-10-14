import type { Request } from 'express';
import { AuditAction, RawInventoryStatus } from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { auditFromRequest } from '../middleware/audit.middleware.js';
import { RawInventory } from '../models/index.js';
import { badRequest, notFound } from '../utils/errors.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { escapeRegex } from '../utils/common.js';
import { toRawInventoryDTO } from '../utils/dto.js';

const SORTABLE: Record<string, string> = {
  createdAt: 'createdAt',
  receivedDate: 'receivedDate',
  currentWeight: 'currentWeight',
  materialName: 'materialName',
};

export async function listRawInventory(
  query: ListQuery & { status?: RawInventoryStatus; material?: string }
) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.material) filter.materialType = query.material;
  if (query.q) filter.materialName = new RegExp(escapeRegex(query.q), 'i');

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, SORTABLE, { createdAt: -1 });

  const [items, total] = await Promise.all([
    RawInventory.find(filter).sort(sort).skip(skip).limit(limit),
    RawInventory.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toRawInventoryDTO), total, page, limit);
}

export async function updateRawInventory(
  req: Request,
  id: string,
  input: { status?: RawInventoryStatus; storageLocation?: string; currentWeight?: number }
) {
  const doc = await RawInventory.findById(id);
  if (!doc) throw notFound('Raw inventory not found');

  const updates: Record<string, unknown> = {};
  if (input.status !== undefined) updates.status = input.status;
  if (input.storageLocation !== undefined) updates.storageLocation = input.storageLocation;
  if (input.currentWeight !== undefined) {
    if (input.currentWeight > doc.purchaseWeight) {
      throw badRequest('Current weight cannot exceed the purchased weight', 'VALIDATION_ERROR', {
        errors: { currentWeight: ['Cannot exceed purchased weight'] },
      });
    }
    updates.currentWeight = input.currentWeight;
  }
  if (Object.keys(updates).length === 0) {
    throw badRequest('At least one field must be provided');
  }

  Object.assign(doc, updates);
  await doc.save();

  await auditFromRequest(req, AuditAction.RAW_INVENTORY_UPDATED, 'RawInventory', id, {
    fields: Object.keys(updates),
  });
  return toRawInventoryDTO(doc);
}
