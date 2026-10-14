import { Role } from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { Inspection, MaterialRequest, PurchaseOffer } from '../models/index.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { toInspectionDTO, toOfferDTO } from '../utils/dto.js';

const INSPECTION_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  inspectedAt: 'inspectedAt',
  actualWeight: 'actualWeight',
};

export async function listInspections(query: ListQuery & { requestId?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.requestId) filter.request = query.requestId;
  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, INSPECTION_SORT, { createdAt: -1 });

  const [items, total] = await Promise.all([
    Inspection.find(filter).sort(sort).skip(skip).limit(limit),
    Inspection.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toInspectionDTO), total, page, limit);
}

const OFFER_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  totalPurchasePrice: 'totalPurchasePrice',
  verifiedWeight: 'verifiedWeight',
};

export async function listOffers(
  user: { _id: any; role: Role },
  query: ListQuery & { status?: string }
) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  if (user.role !== Role.ADMIN) {
    const ownRequests = await MaterialRequest.find({ user: user._id }).select('_id');
    filter.request = { $in: ownRequests.map((r) => r._id) };
  }

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, OFFER_SORT, { createdAt: -1 });

  const [items, total] = await Promise.all([
    PurchaseOffer.find(filter).sort(sort).skip(skip).limit(limit),
    PurchaseOffer.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toOfferDTO), total, page, limit);
}
