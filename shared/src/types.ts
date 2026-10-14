import {
  AuditAction,
  ListingStatus,
  MaterialCategory,
  MaterialGrade,
  MaterialQuality,
  MaterialRequestStatus,
  NotificationType,
  OfferStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PickupPreference,
  ProcessedInventoryStatus,
  ProcessingStage,
  ProcessingStatus,
  RawInventoryStatus,
  Role,
  UserStatus,
} from './enums';

/* ------------------------------------------------------------------ */
/* API envelopes                                                       */
/* ------------------------------------------------------------------ */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

/* ------------------------------------------------------------------ */
/* Material request workflow                                           */
/* ------------------------------------------------------------------ */

export interface ImageDTO {
  url: string;
  publicId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface MaterialRequestDTO {
  id: string;
  user: Pick<UserDTO, 'id' | 'name' | 'email' | 'phone'> | string;
  materialType: MaterialCategory;
  materialName: string;
  description: string;
  approximateWeight: number;
  location: string;
  pickupPreference: PickupPreference;
  expectedPrice?: number | null;
  images: ImageDTO[];
  status: MaterialRequestStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequestInput {
  materialType: MaterialCategory;
  materialName: string;
  description: string;
  approximateWeight: number;
  location: string;
  pickupPreference: PickupPreference;
  expectedPrice?: number;
  images: ImageDTO[];
}

export interface InspectionDTO {
  id: string;
  request: string;
  inspector: string | Pick<UserDTO, 'id' | 'name'>;
  actualWeight: number;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quality: MaterialQuality;
  notes?: string | null;
  scheduledAt?: string | null;
  inspectedAt?: string;
  createdAt: string;
}

export interface CreateInspectionInput {
  actualWeight: number;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quality: MaterialQuality;
  notes?: string;
}

export interface PurchaseOfferDTO {
  id: string;
  request: string | MaterialRequestDTO;
  verifiedWeight: number;
  pricePerKg: number;
  totalPurchasePrice: number;
  pickupDate: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  status: OfferStatus;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferInput {
  verifiedWeight: number;
  pricePerKg: number;
  pickupDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Inventory & processing                                              */
/* ------------------------------------------------------------------ */

export interface RawInventoryDTO {
  id: string;
  materialType: MaterialCategory;
  materialName: string;
  sourceUser: string | Pick<UserDTO, 'id' | 'name'>;
  purchaseRequest: string;
  purchaseOffer: string;
  purchaseWeight: number;
  currentWeight: number;
  purchasePrice: number;
  pricePerKg: number;
  receivedDate: string;
  storageLocation: string;
  status: RawInventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingBatchDTO {
  id: string;
  batchId: string;
  rawInventory: string | RawInventoryDTO;
  materialType: MaterialCategory;
  materialName: string;
  processingType: string;
  stage: ProcessingStage;
  status: ProcessingStatus;
  inputWeight: number;
  outputWeight?: number | null;
  lossWeight?: number | null;
  recoveryPercentage?: number | null;
  qualityGrade?: MaterialGrade | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProcessingInput {
  rawInventory: string;
  processingType: string;
  inputWeight: number;
  notes?: string;
}

export interface CompleteProcessingInput {
  outputWeight: number;
  stage?: ProcessingStage;
  qualityGrade?: MaterialGrade;
  notes?: string;
}

export interface ProcessedMaterialDTO {
  id: string;
  name: string;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quality: MaterialQuality;
  weight: number;
  availableQuantity: number;
  unit: string;
  batch: string | ProcessingBatchDTO;
  description?: string | null;
  images: ImageDTO[];
  status: ProcessedInventoryStatus;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Marketplace                                                         */
/* ------------------------------------------------------------------ */

export interface ProcessingJourneyStepDTO {
  step: number;
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'SKIPPED';
  date?: string | null;
  notes?: string | null;
  location?: string | null;
  metrics?: { label: string; value: string }[];
}

export interface MaterialProvenanceDTO {
  origin: {
    sourceType: string;
    sellerName: string;
    location: string;
    city?: string | null;
    state?: string | null;
    submissionDate?: string | null;
    originalPhotos: ImageDTO[];
    approximateWeight?: number | null;
    originalDescription?: string | null;
  };
  inspection: {
    inspectorRole: string;
    inspectedAt?: string | null;
    grade?: string | null;
    quality?: string | null;
    actualWeight?: number | null;
    notes?: string | null;
    verified: boolean;
  };
  processing: {
    batchId?: string | null;
    processingType?: string | null;
    stage?: string | null;
    status?: string | null;
    inputWeight?: number | null;
    outputWeight?: number | null;
    lossWeight?: number | null;
    recoveryPercentage?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
    notes?: string | null;
  };
  specifications: {
    materialName: string;
    materialType: string;
    grade: string;
    quality: string;
    purity?: string | null;
    standardSpecs?: string | null;
    environmentalImpact?: {
      co2SavedKg: number;
      energySavedKwh?: number;
      landfillDivertedKg: number;
    } | null;
  };
  mediaGallery: {
    originalRaw?: ImageDTO | null;
    duringProcessing?: ImageDTO | null;
    finalProduct?: ImageDTO | null;
  };
  journey: ProcessingJourneyStepDTO[];
}

export interface MarketplaceListingDTO {
  id: string;
  productName: string;
  materialType: MaterialCategory;
  materialName: string;
  grade: MaterialGrade;
  description: string;
  pricePerKg: number;
  availableQuantity: number;
  minOrderQuantity: number;
  images: ImageDTO[];
  qualityInfo: {
    quality: MaterialQuality;
    notes?: string;
    verified: boolean;
  };
  status: ListingStatus;
  processedMaterial: string | ProcessedMaterialDTO;
  provenance?: MaterialProvenanceDTO;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  processedMaterial: string;
  productName: string;
  description: string;
  pricePerKg: number;
  availableQuantity: number;
  minOrderQuantity: number;
  images: ImageDTO[];
  qualityInfo?: { quality: MaterialQuality; notes?: string };
}

export interface MarketplaceQuery extends ListQuery {
  material?: MaterialCategory;
  grade?: MaterialGrade;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export interface OrderItemDTO {
  id: string;
  listing: string;
  productName: string;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quantity: number;
  pricePerKg: number;
  total: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  user: string | Pick<UserDTO, 'id' | 'name' | 'email'>;
  items: OrderItemDTO[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  customerNote?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  listingId: string;
  quantity: number;
  shippingAddress: OrderDTO['shippingAddress'];
  customerNote?: string;
}

export interface OrderStatusInput {
  status: OrderStatus;
  cancelReason?: string;
  paymentStatus?: PaymentStatus;
}

/* ------------------------------------------------------------------ */
/* Admin / dashboard                                                   */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  pendingRequests: number;
  inspections: number;
  purchaseOffers: number;
  rawMaterials: number;
  processingBatches: number;
  processedMaterials: number;
  activeListings: number;
  orders: number;
  revenue: number;
  totalUsers: number;
}

export interface DashboardChartData {
  requestsByStatus: { status: string; count: number }[];
  ordersOverTime: { date: string; orders: number; revenue: number }[];
  inventoryByMaterial: { material: string; weight: number }[];
  listingsByStatus: { status: string; count: number }[];
}

export interface AuditLogDTO {
  id: string;
  actor: string | Pick<UserDTO, 'id' | 'name' | 'email'> | null;
  action: AuditAction | string;
  entity: string;
  entityId: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  user: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface ReportSummary {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalPurchasedKg: number;
  totalPurchaseCost: number;
  totalProcessedKg: number;
  totalSoldKg: number;
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
}
