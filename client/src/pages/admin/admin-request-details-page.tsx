import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestWorkflowActions } from '@/components/admin/request-workflow-actions';
import { ErrorState } from '@/components/shared/error-state';
import { ImageGallery } from '@/components/shared/image-gallery';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Timeline, type TimelineItem } from '@/components/shared/timeline';
import { queryErrorMessage } from '@/context/query-provider';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatWeight,
  prettifyEnum,
} from '@/lib/format';
import { inspectionsService, offersService, requestsService } from '@/services/requests.service';
import { MaterialRequestStatus, type MaterialRequestDTO } from '@/types';

const REQUEST_STAGES: { status: MaterialRequestStatus; label: string }[] = [
  { status: MaterialRequestStatus.SUBMITTED, label: 'Submitted' },
  { status: MaterialRequestStatus.UNDER_REVIEW, label: 'Under review' },
  { status: MaterialRequestStatus.INSPECTION, label: 'Inspection' },
  { status: MaterialRequestStatus.OFFER_MADE, label: 'Offer made' },
  { status: MaterialRequestStatus.ACCEPTED, label: 'Accepted' },
  { status: MaterialRequestStatus.PURCHASED, label: 'Purchased' },
  { status: MaterialRequestStatus.COMPLETED, label: 'Completed' },
];

function refName(ref: string | { name?: string } | null | undefined): string {
  if (!ref) return '—';
  if (typeof ref === 'string') return ref;
  return ref.name ?? '—';
}

function buildTimeline(request: MaterialRequestDTO): TimelineItem[] {
  if (request.status === MaterialRequestStatus.REJECTED) {
    return [
      {
        id: 'submitted',
        title: 'Submitted',
        timestamp: formatDateTime(request.createdAt),
        status: 'completed',
      },
      {
        id: 'rejected',
        title: 'Rejected',
        description: request.rejectionReason ?? 'This request was rejected.',
        timestamp: formatDateTime(request.updatedAt),
        status: 'error',
      },
    ];
  }

  const currentIndex = REQUEST_STAGES.findIndex((stage) => stage.status === request.status);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;

  return REQUEST_STAGES.map((stage, index) => {
    const isCurrent = index === safeIndex;
    const timelineStatus: TimelineItem['status'] =
      index < safeIndex ? 'completed' : isCurrent ? 'current' : 'upcoming';
    return {
      id: stage.status,
      title: stage.label,
      timestamp:
        index === 0
          ? formatDateTime(request.createdAt)
          : isCurrent
            ? formatDateTime(request.updatedAt)
            : undefined,
      status: timelineStatus,
    };
  });
}

function DetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export default function AdminRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const requestQuery = useQuery({
    queryKey: ['admin', 'request', id],
    queryFn: () => requestsService.get(id as string),
    enabled: Boolean(id),
  });

  const inspectionsQuery = useQuery({
    queryKey: ['admin', 'inspections', { requestId: id }],
    queryFn: () => inspectionsService.list({ requestId: id, page: 1, limit: 100 }),
    enabled: Boolean(id),
  });

  const offersQuery = useQuery({
    queryKey: ['admin', 'offers', { requestId: id }],
    queryFn: () => offersService.list({ page: 1, limit: 100 }),
    enabled: Boolean(id),
  });

  if (!id) {
    return <ErrorState message="This request could not be found." />;
  }

  if (requestQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (requestQuery.isError || !requestQuery.data) {
    return (
      <ErrorState
        message={queryErrorMessage(requestQuery.error)}
        onRetry={() => requestQuery.refetch()}
        retryLabel="Reload request"
      />
    );
  }

  const request = requestQuery.data;
  const inspections = inspectionsQuery.data?.items ?? [];
  const offers = (offersQuery.data?.items ?? []).filter((offer) => offer.request === id);
  const seller = typeof request.user === 'string' ? null : request.user;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Material requests
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground">{request.materialName}</span>
          </Link>
        }
        icon={<FileText className="h-5 w-5" />}
        title={request.materialName}
        description={`Submitted on ${formatDateTime(request.createdAt)}`}
        actions={<RequestWorkflowActions request={request} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={request.status} />
        <Badge variant="outline">{prettifyEnum(request.materialType)}</Badge>
        <Badge variant="secondary">{prettifyEnum(request.pickupPreference)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{request.description}</p>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Approx. weight</dt>
                  <dd className="font-medium text-foreground">
                    {formatWeight(request.approximateWeight)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expected price</dt>
                  <dd className="font-medium text-foreground">
                    {request.expectedPrice != null ? `${formatCurrency(request.expectedPrice)}/kg` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pickup preference</dt>
                  <dd className="font-medium text-foreground">
                    {prettifyEnum(request.pickupPreference)}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {request.location}
                  </dd>
                </div>
              </dl>
              {request.rejectionReason ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {request.rejectionReason}
                </div>
              ) : null}
              {request.adminNotes ? (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {request.adminNotes}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {request.images.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos were attached.</p>
              ) : (
                <ImageGallery images={request.images} altPrefix="Material request" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              {inspectionsQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : inspections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inspections recorded yet.</p>
              ) : (
                <ul className="divide-y">
                  {inspections.map((inspection) => (
                    <li key={inspection.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {formatWeight(inspection.actualWeight)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(inspection.inspectedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{prettifyEnum(inspection.materialType)}</Badge>
                        <Badge variant="secondary">Grade {inspection.grade}</Badge>
                        <Badge variant="success">{prettifyEnum(inspection.quality)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          by {refName(inspection.inspector)}
                        </span>
                      </div>
                      {inspection.notes ? (
                        <p className="text-sm text-muted-foreground">{inspection.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase offers</CardTitle>
            </CardHeader>
            <CardContent>
              {offersQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : offers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No offers created yet.</p>
              ) : (
                <ul className="divide-y">
                  {offers.map((offer) => (
                    <li key={offer.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(offer.totalPurchasePrice)}
                        </span>
                        <StatusBadge status={offer.status} />
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div>
                          <dt className="text-muted-foreground">Weight</dt>
                          <dd className="font-medium text-foreground">
                            {formatWeight(offer.verifiedWeight)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Price</dt>
                          <dd className="font-medium text-foreground">
                            {formatCurrency(offer.pricePerKg)}/kg
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Pickup</dt>
                          <dd className="font-medium text-foreground">
                            {formatDate(offer.pickupDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Payment</dt>
                          <dd className="font-medium text-foreground">
                            {prettifyEnum(offer.paymentMethod)}
                          </dd>
                        </div>
                      </dl>
                      {offer.notes ? (
                        <p className="text-sm text-muted-foreground">{offer.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4 text-primary" />
                Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {seller ? (
                <>
                  <p className="font-medium text-foreground">{seller.name}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {seller.email}
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {seller.phone}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {typeof request.user === 'string' ? request.user : request.user.name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={buildTimeline(request)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Material</span>
                <span className="text-foreground">{request.materialName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{prettifyEnum(request.materialType)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Approx. weight</span>
                <span className="font-medium text-foreground">
                  {formatWeight(request.approximateWeight)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={request.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
