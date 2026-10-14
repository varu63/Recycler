import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, prettifyEnum } from '@/lib/format';
import { notificationsService } from '@/services/notifications.service';
import { cn } from '@/lib/utils';

export function NotificationBell({ className }: { className?: string }) {
  const { data: count, isLoading } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 30000,
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsService.list({ page: 1, limit: 6 }),
    refetchInterval: 30000,
  });

  const unread = count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative h-9 w-9', className)}
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {!isLoading && unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => notificationsService.markAllRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {recentLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : !recent?.items.length ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.items.map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={notification.link || '/notifications'}
                    className="flex flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-accent"
                    onClick={() => {
                      if (!notification.read) notificationsService.markRead(notification.id);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      <span className="text-sm font-medium leading-snug">{notification.title}</span>
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      {prettifyEnum(String(notification.type))} ·{' '}
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DropdownMenuSeparator />
        <Link
          to="/notifications"
          className="block px-3 py-2 text-center text-sm font-medium text-primary hover:underline"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
