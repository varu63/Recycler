import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Truck,
  Check,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersService } from '@/services/orders.service';
import { toast } from 'sonner';

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: liveOrder } = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersService.get(id as string),
    enabled: Boolean(id && !id.startsWith('MM')),
  });

  const orderNumber = liveOrder?.orderNumber || '#MM202510080001';
  const placedDate = 'Oct 8, 2025 - 10:45 AM';

  const defaultItems = [
    {
      id: '1',
      name: 'Copper',
      weight: '200 kg',
      subtotal: 120000,
      image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: '2',
      name: 'Aluminium',
      weight: '100 kg',
      subtotal: 22000,
      image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: '3',
      name: 'Steel',
      weight: '150 kg',
      subtotal: 11250,
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const items = liveOrder?.items.map((i) => ({
    id: i.id,
    name: i.productName,
    weight: `${i.quantity} kg`,
    subtotal: i.total,
    image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=400&q=80',
  })) || defaultItems;

  const subtotal = liveOrder?.subtotal || 153250;
  const gst = Math.round(subtotal * 0.18);
  const transportFee = 2000;
  const total = subtotal + gst + transportFee;

  const deliveryName = liveOrder?.shippingAddress.fullName || 'Varun Tomar';
  const deliveryLocation = liveOrder?.shippingAddress.city
    ? `${liveOrder.shippingAddress.city}, ${liveOrder.shippingAddress.state}`
    : 'Delhi, India';
  const deliveryPhone = liveOrder?.shippingAddress.phone || '+91 98765 43210';

  return (
    <div className="space-y-6">
      {/* Header matching Screen 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/my-orders" className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Order {orderNumber}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-6">
            Placed on: {placedDate}
          </p>
        </div>
      </div>

      {/* Horizontal Status Tracker Stepper matching Screen 9 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">
          {/* Step 1: Order Placed */}
          <div className="flex flex-col items-center text-center z-10 space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-900">Order Placed</p>
            <p className="text-[11px] text-slate-400">Oct 8, 2025</p>
          </div>

          <div className="flex-1 h-1 bg-emerald-500 mx-2 -mt-6" />

          {/* Step 2: Processing */}
          <div className="flex flex-col items-center text-center z-10 space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-4 ring-blue-100">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-blue-600">Processing</p>
            <p className="text-[11px] text-slate-400">Oct 8, 2025</p>
          </div>

          <div className="flex-1 h-1 bg-slate-200 mx-2 -mt-6" />

          {/* Step 3: Delivered */}
          <div className="flex flex-col items-center text-center z-10 space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
              <Truck className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Delivered</p>
            <p className="text-[11px] text-slate-400">Oct 9, 2025</p>
          </div>

          <div className="flex-1 h-1 bg-slate-200 mx-2 -mt-6" />

          {/* Step 4: Completed */}
          <div className="flex flex-col items-center text-center z-10 space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Completed</p>
            <p className="text-[11px] text-slate-400">Oct 11, 2025</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout matching Screen 9 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Items
          </h2>

          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between first:pt-1">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-16 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div>
                    <p className="font-bold text-sm text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.weight}</p>
                  </div>
                </div>
                <p className="font-bold text-sm text-slate-900">
                  ₹ {item.subtotal.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Delivery Details & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Delivery Details
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <User className="h-4 w-4 text-slate-400" />
                <span>{deliveryName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{deliveryLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{deliveryPhone}</span>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ₹ {subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>GST (18%)</span>
                <span className="font-semibold text-slate-900">
                  ₹ {gst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transport Fee</span>
                <span className="font-semibold text-slate-900">
                  ₹ {transportFee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹ {total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => toast.info('Support team notified. An agent will contact you shortly.')}
              className="w-full h-11 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm mt-2 flex items-center justify-center gap-2"
            >
              <Headphones className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
