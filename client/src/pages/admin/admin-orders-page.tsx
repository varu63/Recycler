import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminOrderItem {
  id: string;
  user: string;
  totalAmount: string;
  status: 'Processing' | 'Delivered' | 'Shipped' | 'Pending';
  date: string;
}

const SAMPLE_ADMIN_ORDERS: AdminOrderItem[] = [
  {
    id: '#MM202510080001',
    user: 'Varun Tomar',
    totalAmount: '₹ 1,82,835',
    status: 'Processing',
    date: 'Oct 8, 2025',
  },
  {
    id: '#MM202510070090',
    user: 'Neha Gupta',
    totalAmount: '₹ 44,000',
    status: 'Delivered',
    date: 'Oct 7, 2025',
  },
  {
    id: '#MM202510070088',
    user: 'Rohan Das',
    totalAmount: '₹ 22,500',
    status: 'Shipped',
    date: 'Oct 7, 2025',
  },
  {
    id: '#MM202510060087',
    user: 'Amit Singh',
    totalAmount: '₹ 18,750',
    status: 'Processing',
    date: 'Oct 6, 2025',
  },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null);

  const filteredOrders = useMemo(() => {
    return SAMPLE_ADMIN_ORDERS.filter((order) => {
      const matchSearch =
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.user.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header matching Screen 14 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Orders</h1>
      </div>

      {/* Filter Row matching Screen 14 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10 bg-white border-slate-200 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="pl-10 h-10 bg-white border-slate-200 text-xs rounded-xl shadow-none"
          />
        </div>
      </div>

      {/* Orders Table matching Screen 14 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Order ID</th>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-blue-600 text-xs">{order.id}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-800 font-medium">{order.user}</td>
                    <td className="py-3.5 px-6 text-xs font-bold text-slate-900">{order.totalAmount}</td>
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
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="bg-[#0F284E] hover:bg-[#163566] text-white text-xs px-3.5 h-7 rounded-lg shadow-none"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Customer</span>
                <span className="font-bold text-slate-900">{selectedOrder.user}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Order Amount</span>
                <span className="font-bold text-slate-900">{selectedOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Placed Date</span>
                <span className="text-slate-700">{selectedOrder.date}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
