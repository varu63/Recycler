import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatCurrency, formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { offersService } from '@/services/requests.service';
import { OfferStatus, PAGE_SIZE } from '@/types';

const ALL = 'all';

export default function AdminOffersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, status: status === ALL ? undefined : status }),
    [page, status]
  );

  const offersQuery = useQuery({
    queryKey: ['admin', 'offers', params],
    queryFn: () => offersService.list(params),
  });

  const offers = offersQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<BadgeDollarSign className="h-5 w-5" />}
        title="Purchase offers"
        description="All purchase offers sent to sellers from material requests."
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="admin-offers-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-offers-status" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(OfferStatus).map((option) => (
                  <SelectItem key={option} value={option}>
                    {prettifyEnum(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status !== ALL ? (
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus(ALL);
                  setPage(1);
                }}
              >
                Clear filter
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {offersQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(offersQuery.error)}
          onRetry={() => offersQuery.refetch()}
        />
      ) : offersQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : offers.length === 0 ? (
        <EmptyState
          title="No purchase offers"
          description="Offers created against material requests will appear here."
        />
      ) : (
        <div className="space-y-6">
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Price / kg</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => {
                  const requestId =
                    typeof offer.request === 'string' ? offer.request : offer.request.id;
                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <Link
                          to={`/admin/requests/${requestId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {requestId.slice(-6)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatWeight(offer.verifiedWeight)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(offer.pricePerKg)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(offer.totalPurchasePrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(offer.pickupDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prettifyEnum(offer.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={offer.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {offers.map((offer) => {
              const requestId =
                typeof offer.request === 'string' ? offer.request : offer.request.id;
              return (
                <Card key={offer.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/admin/requests/${requestId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Request {requestId.slice(-6)}
                    </Link>
                    <StatusBadge status={offer.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatWeight(offer.verifiedWeight)} · {formatCurrency(offer.pricePerKg)}/kg ·{' '}
                    {prettifyEnum(offer.paymentMethod)}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(offer.totalPurchasePrice)}
                    </span>
                    <span className="text-muted-foreground">{formatDate(offer.pickupDate)}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {offersQuery.data ? (
            <Pagination meta={offersQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
