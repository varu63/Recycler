import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  ListingStatus,
  MaterialRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  ProcessedInventoryStatus,
  ProcessingStatus,
  RawInventoryStatus,
  UserStatus,
} from '@shared/enums';

import { cn } from '@/lib/utils';

interface StatusConfig {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
  className?: string;
}

const IN_PROGRESS_CLASS = 'border-transparent bg-secondary/70 text-secondary-foreground';
const NEUTRAL_CLASS = 'bg-transparent text-muted-foreground';

const materialRequestStatuses: Record<MaterialRequestStatus, StatusConfig> = {
  [MaterialRequestStatus.SUBMITTED]: { label: 'Submitted', variant: 'warning' },
  [MaterialRequestStatus.UNDER_REVIEW]: { label: 'Under review', variant: 'warning' },
  [MaterialRequestStatus.INSPECTION]: { label: 'Inspection', variant: 'secondary' },
  [MaterialRequestStatus.OFFER_MADE]: { label: 'Offer made', variant: 'secondary' },
  [MaterialRequestStatus.ACCEPTED]: { label: 'Accepted', variant: 'success' },
  [MaterialRequestStatus.PURCHASED]: { label: 'Purchased', variant: 'success' },
  [MaterialRequestStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [MaterialRequestStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
};

const offerStatuses: Record<OfferStatus, StatusConfig> = {
  [OfferStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [OfferStatus.ACCEPTED]: { label: 'Accepted', variant: 'success' },
  [OfferStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
  [OfferStatus.EXPIRED]: { label: 'Expired', variant: 'outline', className: NEUTRAL_CLASS },
};

const rawInventoryStatuses: Record<RawInventoryStatus, StatusConfig> = {
  [RawInventoryStatus.PURCHASED]: { label: 'Purchased', variant: 'success' },
  [RawInventoryStatus.RECEIVED]: { label: 'Received', variant: 'success' },
  [RawInventoryStatus.WAITING_FOR_PROCESSING]: {
    label: 'Waiting for processing',
    variant: 'warning',
  },
  [RawInventoryStatus.PROCESSING]: {
    label: 'Processing',
    variant: 'secondary',
    className: IN_PROGRESS_CLASS,
  },
  [RawInventoryStatus.PROCESSED]: { label: 'Processed', variant: 'success' },
};

const processingStatuses: Record<ProcessingStatus, StatusConfig> = {
  [ProcessingStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [ProcessingStatus.IN_PROGRESS]: {
    label: 'In progress',
    variant: 'secondary',
    className: IN_PROGRESS_CLASS,
  },
  [ProcessingStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [ProcessingStatus.FAILED]: { label: 'Failed', variant: 'destructive' },
};

const processedInventoryStatuses: Record<ProcessedInventoryStatus, StatusConfig> = {
  [ProcessedInventoryStatus.AVAILABLE]: { label: 'Available', variant: 'success' },
  [ProcessedInventoryStatus.RESERVED]: { label: 'Reserved', variant: 'warning' },
  [ProcessedInventoryStatus.SOLD_OUT]: { label: 'Sold out', variant: 'secondary' },
};

const listingStatuses: Record<ListingStatus, StatusConfig> = {
  [ListingStatus.DRAFT]: { label: 'Draft', variant: 'outline', className: NEUTRAL_CLASS },
  [ListingStatus.PUBLISHED]: { label: 'Published', variant: 'success' },
  [ListingStatus.PAUSED]: { label: 'Paused', variant: 'warning' },
  [ListingStatus.SOLD_OUT]: { label: 'Sold out', variant: 'secondary' },
  [ListingStatus.ARCHIVED]: { label: 'Archived', variant: 'outline', className: NEUTRAL_CLASS },
};

const orderStatuses: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [OrderStatus.CONFIRMED]: { label: 'Confirmed', variant: 'default' },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    variant: 'secondary',
    className: IN_PROGRESS_CLASS,
  },
  [OrderStatus.READY_FOR_DISPATCH]: {
    label: 'Ready for dispatch',
    variant: 'secondary',
    className: IN_PROGRESS_CLASS,
  },
  [OrderStatus.DISPATCHED]: {
    label: 'Dispatched',
    variant: 'secondary',
    className: IN_PROGRESS_CLASS,
  },
  [OrderStatus.DELIVERED]: { label: 'Delivered', variant: 'success' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' },
};

const paymentStatuses: Record<PaymentStatus, StatusConfig> = {
  [PaymentStatus.UNPAID]: { label: 'Unpaid', variant: 'warning' },
  [PaymentStatus.PAID]: { label: 'Paid', variant: 'success' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', variant: 'outline', className: NEUTRAL_CLASS },
};

const userStatuses: Record<UserStatus, StatusConfig> = {
  [UserStatus.ACTIVE]: { label: 'Active', variant: 'success' },
  [UserStatus.SUSPENDED]: { label: 'Suspended', variant: 'destructive' },
  [UserStatus.LOCKED]: { label: 'Locked', variant: 'warning' },
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  ...materialRequestStatuses,
  ...offerStatuses,
  ...rawInventoryStatuses,
  ...processingStatuses,
  ...processedInventoryStatuses,
  ...listingStatuses,
  ...orderStatuses,
  ...paymentStatuses,
  ...userStatuses,
};

export function prettifyStatus(status: string): string {
  const words = status.replace(/[_-]+/g, ' ').trim();
  if (!words) return 'Unknown';
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status] ?? {
      label: prettifyStatus(status),
      variant: 'outline',
      className: NEUTRAL_CLASS,
    }
  );
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
