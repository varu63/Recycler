import type { Request } from 'express';
import {
  AuditAction,
  MaterialRequestStatus,
  NotificationType,
  OfferStatus,
  Role,
} from '../../../shared/src/enums.js';
import type { CreateMaterialRequestInput, ListQuery } from '../../../shared/src/types.js';
import { recordAudit, auditFromRequest } from '../middleware/audit.middleware.js';
import {
  Inspection,
  MaterialRequest,
  PurchaseOffer,
  RawInventory,
  Upload,
  type IMaterialRequest,
} from '../models/index.js';
import { badRequest, conflict, forbidden, invalidState, notFound } from '../utils/errors.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { escapeRegex } from '../utils/common.js';
import { toInspectionDTO, toOfferDTO, toRequestDTO } from '../utils/dto.js';
import { calcTotalOffer } from '../utils/math.js';
import { notify, notifyAdmins } from './notification.service.js';

const SORTABLE: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approximateWeight: 'approximateWeight',
  materialName: 'materialName',
};

function assertTransition(
  doc: IMaterialRequest,
  allowed: MaterialRequestStatus[],
  action: string
): void {
  if (!allowed.includes(doc.status)) {
    throw invalidState(
      `${action} is not allowed for a request in status ${doc.status}`,
      'INVALID_STATE_TRANSITION'
    );
  }
}

async function loadRequest(id: string): Promise<IMaterialRequest> {
  const doc = await MaterialRequest.findById(id);
  if (!doc) throw notFound('Material request not found');
  return doc;
}

function assertOwnerOrAdmin(doc: IMaterialRequest, user: { _id: any; role: Role }): void {
  const isOwner = String(doc.user) === String(user._id);
  if (!isOwner && user.role !== Role.ADMIN) {
    throw notFound('Material request not found');
  }
}

async function resolveRequestImages(
  user: { _id: any; role: Role },
  images: CreateMaterialRequestInput['images']
) {
  if (!images || images.length === 0) return [];
  const resolved = [];
  for (const image of images) {
    if (!image.publicId) {
      resolved.push(image);
      continue;
    }
    const record = await Upload.findOne({ publicId: image.publicId });
    if (!record) {
      throw badRequest('One or more images are invalid. Please re-upload them.');
    }
    const isOwner = String(record.user) === String(user._id);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw forbidden('You cannot attach images that belong to another user.');
    }
    resolved.push({
      url: record.url,
      publicId: record.publicId,
      thumbnailUrl: record.thumbnailUrl,
      width: record.width,
      height: record.height,
      format: record.format,
      bytes: record.bytes,
    });
  }
  return resolved;
}

export async function createMaterialRequest(
  user: { _id: any; role: Role },
  input: CreateMaterialRequestInput
): Promise<ReturnType<typeof toRequestDTO>> {
  const images = await resolveRequestImages(user, input.images);

  const doc = await MaterialRequest.create({
    user: user._id,
    materialType: input.materialType,
    materialName: input.materialName,
    description: input.description,
    approximateWeight: input.approximateWeight,
    location: input.location,
    pickupPreference: input.pickupPreference,
    expectedPrice: input.expectedPrice ?? null,
    images,
    status: MaterialRequestStatus.SUBMITTED,
  });

  await notifyAdmins(
    NotificationType.NEW_MATERIAL_REQUEST,
    'New material request',
    `A new ${input.materialType} request for ${input.approximateWeight} kg of ${input.materialName} was submitted.`,
    '/admin/requests'
  );
  await recordAudit({
    actor: String(user._id),
    action: AuditAction.ADMIN_APPROVED_REQUEST,
    entity: 'MaterialRequest',
    entityId: String(doc._id),
    metadata: { event: 'REQUEST_SUBMITTED' },
  });

  return toRequestDTO(doc);
}

export async function listMaterialRequests(
  user: { _id: any; role: Role },
  query: ListQuery & { status?: MaterialRequestStatus }
) {
  const filter: Record<string, unknown> = {};
  if (user.role !== Role.ADMIN) filter.user = user._id;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { materialName: pattern },
      { description: pattern },
      { location: pattern },
    ];
  }

  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, SORTABLE, { createdAt: -1 });

  const [items, total] = await Promise.all([
    (user.role === Role.ADMIN
      ? MaterialRequest.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email phone')
      : MaterialRequest.find(filter).sort(sort).skip(skip).limit(limit).populate('user')),
    MaterialRequest.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toRequestDTO), total, page, limit);
}

export async function getMaterialRequest(
  user: { _id: any; role: Role },
  id: string
): Promise<ReturnType<typeof toRequestDTO>> {
  const doc = await loadRequest(id);
  assertOwnerOrAdmin(doc, user);
  if (user.role === Role.ADMIN) await doc.populate('user', 'name email phone');
  return toRequestDTO(doc);
}

export async function reviewMaterialRequest(req: Request, id: string) {
  const doc = await loadRequest(id);
  assertTransition(doc, [MaterialRequestStatus.SUBMITTED], 'Review');
  doc.status = MaterialRequestStatus.UNDER_REVIEW;
  await doc.save();

  await auditFromRequest(req, AuditAction.ADMIN_APPROVED_REQUEST, 'MaterialRequest', id, {
    from: MaterialRequestStatus.SUBMITTED,
    to: MaterialRequestStatus.UNDER_REVIEW,
  });
  await notify(
    String(doc.user),
    NotificationType.REQUEST_STATUS_CHANGED,
    'Request under review',
    'Your material request is now under review.',
    `/requests/${id}`
  );
  return toRequestDTO(doc);
}

export async function scheduleInspection(req: Request, id: string, scheduledAt: Date) {
  const doc = await loadRequest(id);
  assertTransition(
    doc,
    [MaterialRequestStatus.SUBMITTED, MaterialRequestStatus.UNDER_REVIEW],
    'Scheduling an inspection'
  );
  doc.status = MaterialRequestStatus.INSPECTION;
  doc.scheduledAt = scheduledAt;
  await doc.save();

  await auditFromRequest(req, AuditAction.INSPECTION_SCHEDULED, 'MaterialRequest', id, {
    scheduledAt: scheduledAt.toISOString(),
  });
  await notify(
    String(doc.user),
    NotificationType.INSPECTION_SCHEDULED,
    'Inspection scheduled',
    `An inspection has been scheduled for ${scheduledAt.toISOString()}.`,
    `/requests/${id}`
  );
  return toRequestDTO(doc);
}

export async function createInspection(
  req: Request,
  id: string,
  input: {
    actualWeight: number;
    materialType: any;
    grade: any;
    quality: any;
    notes?: string;
  }
) {
  const doc = await loadRequest(id);
  assertTransition(
    doc,
    [MaterialRequestStatus.UNDER_REVIEW, MaterialRequestStatus.INSPECTION],
    'Recording an inspection'
  );

  const user = req.user!;
  const inspection = await Inspection.create({
    request: doc._id,
    inspector: user._id,
    actualWeight: input.actualWeight,
    materialType: input.materialType,
    grade: input.grade,
    quality: input.quality,
    notes: input.notes ?? null,
    scheduledAt: doc.scheduledAt ?? null,
    inspectedAt: new Date(),
  });

  if (doc.status !== MaterialRequestStatus.INSPECTION) {
    doc.status = MaterialRequestStatus.INSPECTION;
    await doc.save();
  }

  await auditFromRequest(req, AuditAction.INSPECTION_COMPLETED, 'Inspection', String(inspection._id), {
    requestId: id,
    actualWeight: input.actualWeight,
    grade: input.grade,
  });
  return toInspectionDTO(inspection);
}

export async function createOffer(
  req: Request,
  id: string,
  input: {
    verifiedWeight: number;
    pricePerKg: number;
    pickupDate: Date;
    paymentMethod: any;
    notes?: string;
  }
) {
  const doc = await loadRequest(id);
  assertTransition(
    doc,
    [MaterialRequestStatus.UNDER_REVIEW, MaterialRequestStatus.INSPECTION],
    'Creating an offer'
  );

  const existing = await PurchaseOffer.findOne({
    request: doc._id,
    status: OfferStatus.PENDING,
  });
  if (existing) throw conflict('A pending offer already exists for this request');

  const totalPurchasePrice = calcTotalOffer(input.verifiedWeight, input.pricePerKg);
  const offer = await PurchaseOffer.create({
    request: doc._id,
    verifiedWeight: input.verifiedWeight,
    pricePerKg: input.pricePerKg,
    totalPurchasePrice,
    pickupDate: input.pickupDate,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? null,
    status: OfferStatus.PENDING,
  });

  doc.status = MaterialRequestStatus.OFFER_MADE;
  await doc.save();

  await auditFromRequest(req, AuditAction.PURCHASE_OFFER_CREATED, 'PurchaseOffer', String(offer._id), {
    requestId: id,
    verifiedWeight: input.verifiedWeight,
    pricePerKg: input.pricePerKg,
    totalPurchasePrice,
  });
  await notify(
    String(doc.user),
    NotificationType.OFFER_RECEIVED,
    'New purchase offer',
    `You have a new offer of ${totalPurchasePrice} for ${input.verifiedWeight} kg.`,
    `/requests/${id}`
  );
  return toOfferDTO(offer);
}

async function loadPendingOffer(requestId: string) {
  const offer = await PurchaseOffer.findOne({
    request: requestId,
    status: OfferStatus.PENDING,
  });
  if (!offer) throw notFound('No pending offer found for this request');
  if (offer.expiresAt && offer.expiresAt.getTime() < Date.now()) {
    offer.status = OfferStatus.EXPIRED;
    await offer.save();
    throw invalidState('This offer has expired', 'INVALID_STATE_TRANSITION');
  }
  return offer;
}

function assertRequestOwner(doc: IMaterialRequest, user: { _id: any }): void {
  if (String(doc.user) !== String(user._id)) {
    throw forbidden('You can only manage offers on your own request');
  }
}

export async function acceptOffer(req: Request, id: string) {
  const doc = await loadRequest(id);
  assertRequestOwner(doc, req.user!);
  assertTransition(doc, [MaterialRequestStatus.OFFER_MADE], 'Accepting an offer');
  const offer = await loadPendingOffer(id);

  offer.status = OfferStatus.ACCEPTED;
  await offer.save();
  doc.status = MaterialRequestStatus.ACCEPTED;
  await doc.save();

  await auditFromRequest(req, AuditAction.USER_ACCEPTED_OFFER, 'PurchaseOffer', String(offer._id), {
    requestId: id,
    totalPurchasePrice: offer.totalPurchasePrice,
  });
  await notify(
    String(doc.user),
    NotificationType.OFFER_ACCEPTED,
    'Offer accepted',
    'You accepted the purchase offer. Our team will proceed with the purchase.',
    `/requests/${id}`
  );
  return { request: toRequestDTO(doc), offer: toOfferDTO(offer) };
}

export async function rejectOffer(req: Request, id: string) {
  const doc = await loadRequest(id);
  assertRequestOwner(doc, req.user!);
  assertTransition(doc, [MaterialRequestStatus.OFFER_MADE], 'Rejecting an offer');
  const offer = await loadPendingOffer(id);

  offer.status = OfferStatus.REJECTED;
  await offer.save();
  doc.status = MaterialRequestStatus.UNDER_REVIEW;
  await doc.save();

  await auditFromRequest(req, AuditAction.USER_REJECTED_OFFER, 'PurchaseOffer', String(offer._id), {
    requestId: id,
  });
  await notify(
    String(doc.user),
    NotificationType.OFFER_REJECTED,
    'Offer rejected',
    'You rejected the purchase offer. The request is back under review.',
    `/requests/${id}`
  );
  return { request: toRequestDTO(doc), offer: toOfferDTO(offer) };
}

export async function purchaseRequest(req: Request, id: string) {
  const doc = await loadRequest(id);
  assertTransition(doc, [MaterialRequestStatus.ACCEPTED], 'Purchasing');

  const offer = await PurchaseOffer.findOne({ request: doc._id, status: OfferStatus.ACCEPTED });
  if (!offer) throw invalidState('No accepted offer found for this request', 'INVALID_STATE_TRANSITION');

  const existing = await RawInventory.findOne({ purchaseRequest: doc._id });
  if (existing) throw conflict('This request has already been purchased');

  const inventory = await RawInventory.create({
    materialType: doc.materialType,
    materialName: doc.materialName,
    sourceUser: doc.user,
    purchaseRequest: doc._id,
    purchaseOffer: offer._id,
    purchaseWeight: offer.verifiedWeight,
    currentWeight: offer.verifiedWeight,
    pricePerKg: offer.pricePerKg,
    purchasePrice: offer.totalPurchasePrice,
    receivedDate: new Date(),
    storageLocation: 'Main Warehouse',
    status: 'PURCHASED',
  });

  doc.status = MaterialRequestStatus.PURCHASED;
  await doc.save();

  await auditFromRequest(req, AuditAction.MATERIAL_PURCHASED, 'MaterialRequest', id, {
    inventoryId: String(inventory._id),
    totalPurchasePrice: offer.totalPurchasePrice,
  });
  await auditFromRequest(req, AuditAction.RAW_INVENTORY_CREATED, 'RawInventory', String(inventory._id), {
    purchaseWeight: offer.verifiedWeight,
  });
  await notify(
    String(doc.user),
    NotificationType.PURCHASE_COMPLETED,
    'Material purchased',
    `Your material was purchased for ${offer.totalPurchasePrice}.`,
    `/requests/${id}`
  );
  return toRequestDTO(doc);
}

export async function completeRequest(req: Request, id: string) {
  const doc = await loadRequest(id);
  assertTransition(doc, [MaterialRequestStatus.PURCHASED], 'Completing');
  doc.status = MaterialRequestStatus.COMPLETED;
  await doc.save();

  await auditFromRequest(req, AuditAction.ADMIN_APPROVED_REQUEST, 'MaterialRequest', id, {
    to: MaterialRequestStatus.COMPLETED,
  });
  await notify(
    String(doc.user),
    NotificationType.REQUEST_STATUS_CHANGED,
    'Request completed',
    'Your material request has been completed. Thank you!',
    `/requests/${id}`
  );
  return toRequestDTO(doc);
}

export async function rejectRequest(req: Request, id: string, reason: string) {
  const doc = await loadRequest(id);
  assertTransition(
    doc,
    [
      MaterialRequestStatus.SUBMITTED,
      MaterialRequestStatus.UNDER_REVIEW,
      MaterialRequestStatus.INSPECTION,
      MaterialRequestStatus.OFFER_MADE,
    ],
    'Rejecting'
  );

  doc.status = MaterialRequestStatus.REJECTED;
  doc.rejectionReason = reason;
  await doc.save();

  await PurchaseOffer.updateMany(
    { request: doc._id, status: OfferStatus.PENDING },
    { $set: { status: OfferStatus.REJECTED } }
  );

  await auditFromRequest(req, AuditAction.ADMIN_REJECTED_REQUEST, 'MaterialRequest', id, { reason });
  await notify(
    String(doc.user),
    NotificationType.REQUEST_STATUS_CHANGED,
    'Request rejected',
    `Your material request was rejected: ${reason}`,
    `/requests/${id}`
  );
  return toRequestDTO(doc);
}
