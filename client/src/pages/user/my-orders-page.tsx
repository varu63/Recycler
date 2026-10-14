import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package, ShoppingBag } from 'lucide-react';
import { ASSETS } from '@/assets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatCurrency, formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { ordersService } from '@/services/orders.service';
import { PAGE_SIZE } from '@/types';

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'mine', { page }],
    queryFn: () => ordersService.list({ page, limit: PAGE_SIZE }),
  });

  const orders = ordersQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<ShoppingBag className="h-5 w-5" />}
        title="My orders"
        description="View your processed material orders and follow their fulfilment status."
        actions={
          <Button variant="outline" asChild>
            <Link to="/marketplace">Browse marketplace</Link>
          </Button>
        }
      />

      {ordersQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(ordersQuery.error)}
          onRetry={() => ordersQuery.refetch()}
        />
      ) : ordersQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          image={ASSETS.illustrations.emptyOrders}
          title="No orders yet"
          description="Once you order processed materials, they will appear here."
          action={
            <Button asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-foreground">{order.orderNumber}</h2>
                          <StatusBadge status={order.status} />
                          <StatusBadge status={order.paymentStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Placed {formatDate(order.createdAt)} · {order.items.length}{' '}
                          {order.items.length === 1 ? 'item' : 'items'} ·{' '}
                          {formatWeight(itemCount)}
                        </p>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {order.items.slice(0, 3).map((item) => (
                            <li key={item.id} className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="truncate">
                                {item.productName} · {prettifyEnum(item.grade)}
                              </span>
                            </li>
                          ))}
                          {order.items.length > 3 ? (
                            <li className="text-muted-foreground">+{order.items.length - 3} more</li>
                          ) : null}
                        </ul>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/orders/${order.id}`}>
                            View details
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {ordersQuery.data ? (
            <Pagination meta={ordersQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
