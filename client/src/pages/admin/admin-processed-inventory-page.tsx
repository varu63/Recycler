import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { inventoryService } from '@/services/inventory.service';
import {
  PAGE_SIZE,
  ProcessedInventoryStatus,
  type ProcessedMaterialDTO,
} from '@/types';

const ALL = 'all';

function batchLabel(batch: ProcessedMaterialDTO['batch']): string {
  if (typeof batch === 'string') return batch;
  return batch.batchId;
}

export default function AdminProcessedInventoryPage() {
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

  const processedQuery = useQuery({
    queryKey: ['admin', 'processed-inventory', params],
    queryFn: () => inventoryService.processedList(params),
  });

  const items = processedQuery.data?.items ?? [];
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
        icon={<Layers className="h-5 w-5" />}
        title="Processed inventory"
        description="Finished materials produced from completed processing batches."
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="admin-processed-search">Search</Label>
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search by material name"
              aria-label="Search processed inventory"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-processed-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-processed-status" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(ProcessedInventoryStatus).map((option) => (
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

      {processedQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(processedQuery.error)}
          onRetry={() => processedQuery.refetch()}
        />
      ) : processedQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No processed inventory"
          description="Completed processing batches will produce inventory shown here."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {prettifyEnum(item.materialType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Grade {item.grade}</Badge>
                        <Badge variant="outline">{prettifyEnum(item.quality)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWeight(item.weight)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.availableQuantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{batchLabel(item.batch)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {items.map((item) => (
              <Card key={item.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prettifyEnum(item.materialType)} · {batchLabel(item.batch)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Grade {item.grade}</Badge>
                  <Badge variant="outline">{prettifyEnum(item.quality)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatWeight(item.weight)} · {item.availableQuantity} {item.unit} available
                </p>
              </Card>
            ))}
          </div>

          {processedQuery.data ? (
            <Pagination meta={processedQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
