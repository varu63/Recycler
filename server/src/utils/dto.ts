import type {
  AuditLogDTO,
  InspectionDTO,
  MarketplaceListingDTO,
  MaterialRequestDTO,
  NotificationDTO,
  OrderDTO,
  OrderItemDTO,
  ProcessedMaterialDTO,
  ProcessingBatchDTO,
  PurchaseOfferDTO,
  RawInventoryDTO,
  UserDTO,
} from '../../../shared/src/types.js';

function iso(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  return new Date(value as string | number | Date).toISOString();
}

function idOf(value: any): string {
  if (value && typeof value === 'object') {
    if (value._id !== undefined) return String(value._id);
    if (value.id !== undefined) return String(value.id);
  }
  return String(value);
}

function userRef(value: any): any {
  if (!value) return '';
  if (typeof value === 'object' && (value.email !== undefined || value.name !== undefined)) {
    return { id: idOf(value), name: value.name, email: value.email, phone: value.phone };
  }
  return idOf(value);
}

function userNameRef(value: any): any {
  if (!value) return '';
  if (typeof value === 'object' && value.name !== undefined) {
    return { id: idOf(value), name: value.name };
  }
  return idOf(value);
}

export function toUserDTO(user: any): UserDTO {
  return {
    id: idOf(user),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
  };
}

export function toRequestDTO(doc: any): MaterialRequestDTO {
  return {
    id: idOf(doc),
    user: userRef(doc.user),
    materialType: doc.materialType,
    materialName: doc.materialName,
    description: doc.description,
    approximateWeight: doc.approximateWeight,
    location: doc.location,
    pickupPreference: doc.pickupPreference,
    expectedPrice: doc.expectedPrice ?? null,
    images: (doc.images ?? []).map((img: any) => ({
      url: img.url,
      publicId: img.publicId,
      thumbnailUrl: img.thumbnailUrl,
      width: img.width,
      height: img.height,
      format: img.format,
      bytes: img.bytes,
    })),
    status: doc.status,
    rejectionReason: doc.rejectionReason ?? null,
    adminNotes: doc.adminNotes ?? null,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toInspectionDTO(doc: any): InspectionDTO {
  return {
    id: idOf(doc),
    request: idOf(doc.request),
    inspector: userNameRef(doc.inspector),
    actualWeight: doc.actualWeight,
    materialType: doc.materialType,
    grade: doc.grade,
    quality: doc.quality,
    notes: doc.notes ?? null,
    scheduledAt: doc.scheduledAt ? iso(doc.scheduledAt) : null,
    inspectedAt: iso(doc.inspectedAt),
    createdAt: iso(doc.createdAt),
  };
}

export function toOfferDTO(doc: any): PurchaseOfferDTO {
  return {
    id: idOf(doc),
    request: idOf(doc.request),
    verifiedWeight: doc.verifiedWeight,
    pricePerKg: doc.pricePerKg,
    totalPurchasePrice: doc.totalPurchasePrice,
    pickupDate: iso(doc.pickupDate),
    paymentMethod: doc.paymentMethod,
    notes: doc.notes ?? null,
    status: doc.status,
    expiresAt: doc.expiresAt ? iso(doc.expiresAt) : null,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toRawInventoryDTO(doc: any): RawInventoryDTO {
  return {
    id: idOf(doc),
    materialType: doc.materialType,
    materialName: doc.materialName,
    sourceUser: userNameRef(doc.sourceUser),
    purchaseRequest: idOf(doc.purchaseRequest),
    purchaseOffer: idOf(doc.purchaseOffer),
    purchaseWeight: doc.purchaseWeight,
    currentWeight: doc.currentWeight,
    purchasePrice: doc.purchasePrice,
    pricePerKg: doc.pricePerKg,
    receivedDate: iso(doc.receivedDate),
    storageLocation: doc.storageLocation,
    status: doc.status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toBatchDTO(doc: any): ProcessingBatchDTO {
  return {
    id: idOf(doc),
    batchId: doc.batchId,
    rawInventory: idOf(doc.rawInventory),
    materialType: doc.materialType,
    materialName: doc.materialName,
    processingType: doc.processingType,
    stage: doc.stage,
    status: doc.status,
    inputWeight: doc.inputWeight,
    outputWeight: doc.outputWeight ?? null,
    lossWeight: doc.lossWeight ?? null,
    recoveryPercentage: doc.recoveryPercentage ?? null,
    qualityGrade: doc.qualityGrade ?? null,
    startedAt: doc.startedAt ? iso(doc.startedAt) : null,
    completedAt: doc.completedAt ? iso(doc.completedAt) : null,
    notes: doc.notes ?? null,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toProcessedImageDTO(doc: any): ProcessedMaterialDTO {
  return {
    id: idOf(doc),
    name: doc.name,
    materialType: doc.materialType,
    grade: doc.grade,
    quality: doc.quality,
    weight: doc.weight,
    availableQuantity: doc.availableQuantity,
    unit: doc.unit,
    batch: idOf(doc.batch),
    description: doc.description ?? null,
    images: (doc.images ?? []).map((img: any) => ({
      url: img.url,
      publicId: img.publicId,
      thumbnailUrl: img.thumbnailUrl,
      width: img.width,
      height: img.height,
      format: img.format,
      bytes: img.bytes,
    })),
    status: doc.status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toListingDTO(doc: any): MarketplaceListingDTO {
  return {
    id: idOf(doc),
    productName: doc.productName,
    materialType: doc.materialType,
    materialName: doc.materialName,
    grade: doc.grade,
    description: doc.description,
    pricePerKg: doc.pricePerKg,
    availableQuantity: doc.availableQuantity,
    minOrderQuantity: doc.minOrderQuantity,
    images: (doc.images ?? []).map((img: any) => ({
      url: img.url,
      publicId: img.publicId,
      thumbnailUrl: img.thumbnailUrl,
      width: img.width,
      height: img.height,
      format: img.format,
      bytes: img.bytes,
    })),
    qualityInfo: {
      quality: doc.qualityInfo?.quality,
      notes: doc.qualityInfo?.notes,
      verified: Boolean(doc.qualityInfo?.verified),
    },
    status: doc.status,
    processedMaterial: idOf(doc.processedMaterial),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toOrderItemDTO(item: any): OrderItemDTO {
  return {
    id: idOf(item),
    listing: idOf(item.listing),
    productName: item.productName,
    materialType: item.materialType,
    grade: item.grade,
    quantity: item.quantity,
    pricePerKg: item.pricePerKg,
    total: item.total,
  };
}

export function toOrderDTO(doc: any): OrderDTO {
  const items = Array.isArray(doc.items) ? doc.items : (doc.items as any)?.toArray?.() ?? [];
  return {
    id: idOf(doc),
    orderNumber: doc.orderNumber,
    user: userRef(doc.user),
    items: items.map(toOrderItemDTO),
    subtotal: doc.subtotal,
    total: doc.total,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    shippingAddress: {
      fullName: doc.shippingAddress?.fullName,
      line1: doc.shippingAddress?.line1,
      city: doc.shippingAddress?.city,
      state: doc.shippingAddress?.state,
      postalCode: doc.shippingAddress?.postalCode,
      country: doc.shippingAddress?.country,
      phone: doc.shippingAddress?.phone,
    },
    customerNote: doc.customerNote ?? null,
    cancelReason: doc.cancelReason ?? null,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toNotificationDTO(doc: any): NotificationDTO {
  return {
    id: idOf(doc),
    user: idOf(doc.user),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    link: doc.link ?? null,
    read: Boolean(doc.read),
    createdAt: iso(doc.createdAt),
  };
}

export function toAuditLogDTO(doc: any): AuditLogDTO {
  let actor: AuditLogDTO['actor'] = null;
  if (doc.actor) {
    actor =
      typeof doc.actor === 'object' && (doc.actor.email !== undefined || doc.actor.name !== undefined)
        ? { id: idOf(doc.actor), name: doc.actor.name, email: doc.actor.email }
        : idOf(doc.actor);
  }
  return {
    id: idOf(doc),
    actor,
    action: doc.action,
    entity: doc.entity,
    entityId: doc.entityId ?? null,
    ip: doc.ip ?? null,
    metadata: doc.metadata ?? null,
    createdAt: iso(doc.createdAt),
  };
}
