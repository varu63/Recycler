import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { queryErrorMessage } from '@/context/query-provider';
import { formatRelativeTime, prettifyEnum } from '@/lib/format';
import { notificationsService } from '@/services/notifications.service';
import { PAGE_SIZE } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'list', { page }],
    queryFn: () => notificationsService.list({ page, limit: PAGE_SIZE }),
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      invalidate();
      toast.success('All notifications marked as read.');
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = unreadQuery.data ?? 0;

  const handleOpen = (id: string, read: boolean, link?: string | null) => {
    if (!read) markReadMutation.mutate(id);
    if (link) navigate(link);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Bell className="h-5 w-5" />}
        title="Notifications"
        description="Stay up to date with your requests, offers and orders."
        actions={
          <Button
            variant="outline"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      {notificationsQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(notificationsQuery.error)}
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : notificationsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="You have no notifications right now. We'll let you know when something happens."
        />
      ) : (
        <div className="space-y-8">
          <Card className="divide-y overflow-hidden">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  handleOpen(notification.id, notification.read, notification.link)
                }
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/50',
                  !notification.read && 'bg-accent/20'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    notification.read ? 'bg-transparent' : 'bg-primary'
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        'text-sm',
                        notification.read ? 'font-medium text-foreground' : 'font-semibold text-foreground'
                      )}
                    >
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                  <span className="block text-sm text-muted-foreground">{notification.message}</span>
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    {prettifyEnum(String(notification.type))}
                  </span>
                </span>
                {!notification.read ? (
                  <span className="sr-only">Unread</span>
                ) : null}
              </button>
            ))}
          </Card>

          {notificationsQuery.data ? (
            <Pagination meta={notificationsQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
