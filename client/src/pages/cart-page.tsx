import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, MapPin, ArrowRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    subtotal,
    gst,
    transportFee,
    totalAmount,
    deliveryAddress,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Cart ({itemCount} {itemCount === 1 ? 'Material' : 'Materials'})
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
            <p className="text-xs text-slate-500 mt-1">Browse available materials to add items to your cart.</p>
          </div>
          <Button asChild className="bg-[#0F284E] hover:bg-[#163566] text-white">
            <Link to="/marketplace">Explore Marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Table matching Screen 7 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Material</th>
                    <th className="py-4 px-6">Price (per kg)</th>
                    <th className="py-4 px-6 text-center">Quantity (kg)</th>
                    <th className="py-4 px-6 text-right">Subtotal</th>
                    <th className="py-4 px-6 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const itemTotal = item.pricePerKg * item.quantityKg;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Material thumbnail & title */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-14 w-16 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-400">{item.location}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price per kg */}
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          ₹ {item.pricePerKg.toLocaleString('en-IN')}
                        </td>

                        {/* Quantity Stepper */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantityKg - 50)}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-12 text-center text-xs font-bold text-slate-800">
                                {item.quantityKg}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantityKg + 50)}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                          ₹ {itemTotal.toLocaleString('en-IN')}
                        </td>

                        {/* Remove trash icon */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary Section matching Screen 7 */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Left Card: Delivery Location */}
            <div className="md:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Delivery Location</h3>
                  <Link to="/checkout" className="text-xs font-semibold text-blue-600 hover:underline">
                    Change
                  </Link>
                </div>
                <div className="flex items-start gap-3 pt-4">
                  <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {deliveryAddress.city}, {deliveryAddress.state}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Delivery available in your area. Estimated delivery: 3-5 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Price Summary */}
            <div className="md:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                Price Summary
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {gst.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Transport Fee</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {transportFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">Total Amount</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    ₹ {totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full h-11 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm mt-3 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
