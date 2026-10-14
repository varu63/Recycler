import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { queryErrorMessage } from '@/context/query-provider';
import { formatDateTime, formatWeight, prettifyEnum } from '@/lib/format';
import { inspectionsService } from '@/services/requests.service';
import { PAGE_SIZE } from '@/types';

function refName(ref: string | { name?: string }): string {
  if (typeof ref === 'string') return ref;
  return ref.name ?? '—';
}

export default function AdminInspectionsPage() {
  const [page, setPage] = useState(1);

  const inspectionsQuery = useQuery({
    queryKey: ['admin', 'inspections', { page }],
    queryFn: () => inspectionsService.list({ page, limit: PAGE_SIZE }),
  });

  const inspections = inspectionsQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<ClipboardCheck className="h-5 w-5" />}
        title="Inspections"
        description="All inspections recorded across material requests."
      />

      {inspectionsQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(inspectionsQuery.error)}
          onRetry={() => inspectionsQuery.refetch()}
        />
      ) : inspectionsQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : inspections.length === 0 ? (
        <EmptyState
          title="No inspections yet"
          description="Inspections recorded against material requests will appear here."
        />
      ) : (
        <div className="space-y-6">
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Inspected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Link
                        to={`/admin/requests/${inspection.request}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inspection.request.slice(-6)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {prettifyEnum(inspection.materialType)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWeight(inspection.actualWeight)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Grade {inspection.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{prettifyEnum(inspection.quality)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {refName(inspection.inspector)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(inspection.inspectedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {inspections.map((inspection) => (
              <Card key={inspection.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/requests/${inspection.request}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Request {inspection.request.slice(-6)}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(inspection.inspectedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{prettifyEnum(inspection.materialType)}</Badge>
                  <Badge variant="secondary">Grade {inspection.grade}</Badge>
                  <Badge variant="success">{prettifyEnum(inspection.quality)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatWeight(inspection.actualWeight)} · {refName(inspection.inspector)}
                </p>
              </Card>
            ))}
          </div>

          {inspectionsQuery.data ? (
            <Pagination meta={inspectionsQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
