import { MaterialCategory, MaterialGrade, MaterialQuality, OrderStatus, PaymentMethod, Role } from './enums';

export const ROLES = Object.values(Role) as string[];
export const MATERIAL_CATEGORIES = Object.values(MaterialCategory);
export const MATERIAL_GRADES = Object.values(MaterialGrade);
export const MATERIAL_QUALITIES = Object.values(MaterialQuality);
export const PAYMENT_METHODS = Object.values(PaymentMethod);
export const ORDER_STATUSES = Object.values(OrderStatus);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export const PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

export const UPLOAD_MAX_FILES = 6;
export const UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const UPLOAD_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const CLOUDINARY_UPLOAD_FOLDER = 'material-mundi';

export const LOW_INVENTORY_THRESHOLD_KG = 100;

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};
