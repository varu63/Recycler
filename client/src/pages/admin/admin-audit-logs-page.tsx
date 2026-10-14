import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatDateTime, prettifyEnum } from '@/lib/format';
import { adminService } from '@/services/admin.service';
import { PAGE_SIZE, type AuditLogDTO } from '@/types';

function actorLabel(actor: AuditLogDTO['actor']): string {
  if (!actor) return 'System';
  if (typeof actor === 'string') return actor;
  return actor.name || actor.email || '—';
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      entity: entity.trim() || undefined,
      action: action.trim() || undefined,
    }),
    [page, entity, action]
  );

  const logsQuery = useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminService.auditLogs(params),
  });

  const logs = logsQuery.data?.items ?? [];
  const hasFilters = entity.trim() !== '' || action.trim() !== '';

  const resetFilters = () => {
    setEntity('');
    setAction('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<ScrollText className="h-5 w-5" />}
        title="Audit logs"
        description="Immutable record of actions performed across the platform."
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="audit-entity">Entity</Label>
            <Input
              id="audit-entity"
              value={entity}
              placeholder="e.g. MaterialRequest"
              onChange={(event) => {
                setEntity(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-action">Action</Label>
            <Input
              id="audit-action"
              value={action}
              placeholder="e.g. MATERIAL_PURCHASED"
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
            />
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

      {logsQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(logsQuery.error)}
          onRetry={() => logsQuery.refetch()}
        />
      ) : logsQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="Recorded audit entries will appear here."
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
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-foreground">{actorLabel(log.actor)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{prettifyEnum(log.action)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.entity}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entityId ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.ip ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {logs.map((log) => (
              <Card key={log.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{prettifyEnum(log.action)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{actorLabel(log.actor)}</p>
                <p className="text-xs text-muted-foreground">
                  {log.entity}
                  {log.entityId ? ` · ${log.entityId}` : ''}
                  {log.ip ? ` · ${log.ip}` : ''}
                </p>
              </Card>
            ))}
          </div>

          {logsQuery.data ? (
            <Pagination meta={logsQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
