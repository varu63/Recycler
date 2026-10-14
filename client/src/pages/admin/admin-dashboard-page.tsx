import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ListOrdered,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderRow {
  id: string;
  material: string;
  quantity: string;
  amount: string;
  status: 'Processing' | 'Delivered' | 'Shipped' | 'Cancelled';
  date: string;
}

const RECENT_ORDERS: OrderRow[] = [
  {
    id: '#MM202510080001',
    material: 'Copper',
    quantity: '200 kg',
    amount: '₹ 1,82,835',
    status: 'Processing',
    date: 'Oct 8, 2025',
  },
  {
    id: '#MM202510070090',
    material: 'Aluminium',
    quantity: '100 kg',
    amount: '₹ 44,000',
    status: 'Delivered',
    date: 'Oct 7, 2025',
  },
  {
    id: '#MM202510070088',
    material: 'Steel',
    quantity: '150 kg',
    amount: '₹ 22,500',
    status: 'Shipped',
    date: 'Oct 7, 2025',
  },
  {
    id: '#MM202510060087',
    material: 'Brass',
    quantity: '50 kg',
    amount: '₹ 18,750',
    status: 'Processing',
    date: 'Oct 6, 2025',
  },
];

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('30_days');

  return (
    <div className="space-y-6">
      {/* Header matching Screen 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of platform activity</p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 h-9 bg-white border-slate-200 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="Last 30 Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">Last 7 Days</SelectItem>
            <SelectItem value="30_days">Last 30 Days</SelectItem>
            <SelectItem value="90_days">Last 90 Days</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4 KPI Stat Cards matching Screen 12 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">1,248</p>
        </div>

        {/* Total Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Listings</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +8%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">892</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +15%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">456</p>
        </div>

        {/* Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Revenue (This Month)</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +18%
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹ 12,48,320</p>
        </div>
      </div>

      {/* Recent Orders Table matching Screen 12 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Material</th>
                <th className="py-3.5 px-6">Quantity</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-blue-600 text-xs">{order.id}</td>
                  <td className="py-3.5 px-6 font-medium text-slate-900">{order.material}</td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs">{order.quantity}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{order.amount}</td>
                  <td className="py-3.5 px-6">
                    {order.status === 'Processing' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Processing
                      </span>
                    )}
                    {order.status === 'Delivered' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Delivered
                      </span>
                    )}
                    {order.status === 'Shipped' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Shipped
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-500">{order.date}</td>
                  <td className="py-3.5 px-6 text-right">
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#0F284E] hover:bg-[#163566] text-white text-xs px-3.5 h-7 rounded-lg shadow-none"
                    >
                      <Link to={`/admin/orders`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
