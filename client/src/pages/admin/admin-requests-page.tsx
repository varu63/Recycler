import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Eye } from 'lucide-react';
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
import { RequestWorkflowActions } from '@/components/admin/request-workflow-actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { requestsService } from '@/services/requests.service';
import { MaterialRequestStatus, PAGE_SIZE, type MaterialRequestDTO } from '@/types';

const ALL = 'all';

function sellerLabel(request: MaterialRequestDTO): string {
  if (typeof request.user === 'string') return request.user;
  return request.user.name || request.user.email || 'Unknown';
}

export default function AdminRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 350);
    return () => window.clearTimeout(id);
  }, [q]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: status === ALL ? undefined : status,
      q: debouncedQ.trim() || undefined,
    }),
    [page, status, debouncedQ]
  );

  const requestsQuery = useQuery({
    queryKey: ['admin', 'requests', params],
    queryFn: () => requestsService.list(params),
  });

  const requests = requestsQuery.data?.items ?? [];
  const hasFilters = status !== ALL || debouncedQ.trim() !== '';

  const resetFilters = () => {
    setStatus(ALL);
    setQ('');
    setDebouncedQ('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title="Material requests"
        description="Review submitted materials, schedule inspections and manage purchase offers."
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-requests-search">Search</Label>
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search by material, description or location"
              aria-label="Search material requests"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-requests-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-requests-status" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(MaterialRequestStatus).map((option) => (
                  <SelectItem key={option} value={option}>
                    {prettifyEnum(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters ? (
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {requestsQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(requestsQuery.error)}
          onRetry={() => requestsQuery.refetch()}
        />
      ) : requestsQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No material requests"
          description="No requests match the current filters."
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{request.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        {prettifyEnum(request.materialType)} · {request.location}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sellerLabel(request)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWeight(request.approximateWeight)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/requests/${request.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <RequestWorkflowActions request={request} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {requests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{request.materialName}</p>
                    <p className="text-xs text-muted-foreground">
                      {prettifyEnum(request.materialType)} · {request.location}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{sellerLabel(request)}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatWeight(request.approximateWeight)} · {formatDate(request.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/requests/${request.id}`}>View</Link>
                    </Button>
                    <RequestWorkflowActions request={request} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {requestsQuery.data ? (
            <Pagination meta={requestsQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
