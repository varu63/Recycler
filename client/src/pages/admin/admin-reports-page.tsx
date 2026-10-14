import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ClipboardCheck,
  DollarSign,
  Factory,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { queryErrorMessage } from '@/context/query-provider';
import { formatCurrency, formatNumber, formatWeight, prettifyEnum } from '@/lib/format';
import { adminService } from '@/services/admin.service';

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80 pt-2">{children}</CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminService.reports(),
  });

  if (reportsQuery.isError) {
    return (
      <ErrorState
        message={queryErrorMessage(reportsQuery.error)}
        onRetry={() => reportsQuery.refetch()}
      />
    );
  }

  if (reportsQuery.isLoading || !reportsQuery.data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const report = reportsQuery.data;
  const revenueData = report.revenueSeries.map((item) => ({
    month: item.month,
    revenue: item.revenue,
    orders: item.orders,
  }));

  const statCards = [
    { title: 'Total requests', value: report.totalRequests, icon: <BarChart3 className="h-5 w-5" /> },
    { title: 'Approved requests', value: report.approvedRequests, icon: <ClipboardCheck className="h-5 w-5" /> },
    { title: 'Rejected requests', value: report.rejectedRequests, icon: <XCircle className="h-5 w-5" /> },
    {
      title: 'Purchased',
      value: formatWeight(report.totalPurchasedKg),
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: 'Purchase cost',
      value: formatCurrency(report.totalPurchaseCost),
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: 'Processed',
      value: formatWeight(report.totalProcessedKg),
      icon: <Factory className="h-5 w-5" />,
    },
    {
      title: 'Sold',
      value: formatWeight(report.totalSoldKg),
      icon: <PackageCheck className="h-5 w-5" />,
    },
    {
      title: 'Revenue',
      value: formatCurrency(report.totalRevenue),
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Reports"
        description="Aggregate metrics across the full material lifecycle."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
        ))}
      </div>

      <ChartCard title="Revenue over time">
        {revenueData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No revenue data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${formatNumber(Number(value), 0)}`}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === 'Revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value))
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="orders"
                name="Orders"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders by status</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {report.ordersByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.ordersByStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell className="text-foreground">{prettifyEnum(row.status)}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {row.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
