import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  BadgeDollarSign,
  Globe2,
  Recycle,
  Tag,
  ShoppingBag,
  ArrowRight,
  ClipboardList,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatDate, formatWeight } from '@/lib/format';
import { requestsService } from '@/services/requests.service';
import { ordersService } from '@/services/orders.service';

export default function DashboardPage() {
  const requestsQuery = useQuery({
    queryKey: ['requests', 'mine', { limit: 5 }],
    queryFn: () => requestsService.list({ page: 1, limit: 5 }),
  });

  const ordersQuery = useQuery({
    queryKey: ['orders', 'mine', { limit: 5 }],
    queryFn: () => ordersService.list({ page: 1, limit: 5 }),
  });

  const recentRequests = requestsQuery.data?.items ?? [];
  const recentOrders = ordersQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      {/* Hero Banner matching Screen 2 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#09192F] via-[#0D2444] to-[#071325] p-8 sm:p-12 text-white shadow-xl border border-slate-800">
        <img
          src="/bglogo.png"
          alt="Logo"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 max-w-5xl space-y-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Turn Waste into Value
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-normal">
            Buy and Sell Metal & Recyclable Materials
          </p>

          {/* Action Buttons row */}
          <div className="pt-6 flex flex-wrap gap-4 sm:gap-6">
            {/* Sell Material CTA */}
            <Link
              to="/sell-material"
              className="group flex items-center gap-4 bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-xl shadow-md transition-all duration-200 border border-slate-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Tag className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Sell Material
                </p>
                <p className="text-xs text-slate-500 font-medium">List your materials</p>
              </div>
            </Link>

            {/* Buy Material CTA */}
            <Link
              to="/marketplace"
              className="group flex items-center gap-4 bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-xl shadow-md transition-all duration-200 border border-slate-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                  Buy Material
                </p>
                <p className="text-xs text-slate-500 font-medium">Find materials you need</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-sky-400 to-transparent" />
      </div>

      {/* 4 Feature Cards matching Screen 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Trusted Trade</h4>
            <p className="text-xs text-slate-500 font-medium">Verified users & listings</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Fair Pricing</h4>
            <p className="text-xs text-slate-500 font-medium">Get the best value</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Wide Network</h4>
            <p className="text-xs text-slate-500 font-medium">Across multiple locations</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Recycle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Sustainable Future</h4>
            <p className="text-xs text-slate-500 font-medium">Support recycling</p>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2 pt-2">
        {/* Recent Listings / Requests */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              Recent Listings
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/my-listings"
                className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
              >
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requestsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <p>No listings created yet.</p>
                <Button asChild size="sm" className="mt-3 bg-[#0A192F]">
                  <Link to="/sell-material">Sell your first material</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentRequests.slice(0, 3).map((item) => (
                  <li key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.materialName}</p>
                      <p className="text-xs text-slate-500">
                        {formatWeight(item.approximateWeight)} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              Recent Orders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/my-orders"
                className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
              >
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <p>No orders placed yet.</p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOrders.slice(0, 3).map((order) => (
                  <li key={order.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
