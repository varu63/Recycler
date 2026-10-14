import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/cart-context';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { deliveryAddress, setDeliveryAddress, totalAmount, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'bank' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: deliveryAddress.fullName || 'Varun Tomar',
    mobile: deliveryAddress.mobile || '98765 43210',
    company: deliveryAddress.company || 'MaxSpace Pvt Ltd',
    address: deliveryAddress.address || '123 Green Park, Near Main Road',
    city: deliveryAddress.city || 'Delhi',
    state: deliveryAddress.state || 'Delhi',
    pincode: deliveryAddress.pincode || '110001',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryAddress(formData);
    setStep(2);
  };

  const handleConfirmOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders/MM202510080001');
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Checkout</h1>
      </div>

      {/* 3-Step Progress Header matching Screen 8 */}
      <div className="flex items-center justify-center max-w-2xl mx-auto py-2">
        <div className="flex items-center w-full justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span
              className={`text-xs font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Delivery Details
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-slate-200">
            <div className={`h-full bg-blue-600 ${step > 1 ? 'w-full' : 'w-0'}`} />
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span
              className={`text-xs font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Payment
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-slate-200">
            <div className={`h-full bg-blue-600 ${step >= 3 ? 'w-full' : 'w-0'}`} />
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-bold ${step === 3 ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Confirm Order
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: Delivery Information Form matching Screen 8 */}
      {step === 1 && (
        <form onSubmit={handleContinueToPayment} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Delivery Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Mobile Number *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
                    +91
                  </span>
                  <Input
                    required
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    className="rounded-l-none h-10 bg-slate-50/70 border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Business / Company (Optional)
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Delivery Address *</Label>
                <Input
                  required
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">City *</Label>
                <Input
                  required
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">State *</Label>
                <Input
                  required
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Pin Code *</Label>
                <Input
                  required
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="h-10 bg-slate-50/70 border-slate-200"
                />
              </div>
            </div>

            {/* Map Preview Box matching Screen 8 */}
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Delivery Location</p>
                  <p className="text-sm font-bold text-slate-800">
                    {formData.city}, {formData.state}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Address location confirmed')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cart')}
              className="h-11 px-6 border-slate-300 font-semibold text-slate-700"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-11 px-8 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm"
            >
              Continue to Payment
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Payment Method */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Select Payment Method
            </h2>

            <div className="space-y-3">
              {[
                { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', desc: 'Instant UPI QR & ID transfer' },
                { id: 'card', label: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay' },
                { id: 'bank', label: 'Net Banking / Bank Transfer', desc: 'Direct RTGS / NEFT / IMPS' },
                { id: 'cod', label: 'Payment on Delivery', desc: 'Pay via cash/UPI upon material weighing & delivery' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === m.id
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id as any)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.label}</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Payable</span>
              <span className="text-xl font-extrabold text-slate-900">
                ₹ {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="h-11 px-6 border-slate-300 font-semibold text-slate-700"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="h-11 px-8 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm"
            >
              Review &amp; Confirm
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm Order */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Confirm Your Order
            </h2>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400">Shipping To</p>
                <p className="font-bold text-slate-900">{formData.fullName}</p>
                <p className="text-slate-600">{formData.address}</p>
                <p className="text-slate-600">
                  {formData.city}, {formData.state} - {formData.pincode}
                </p>
                <p className="text-slate-600">Phone: +91 {formData.mobile}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Payment Option</span>
                <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <span className="font-bold">Final Total Amount</span>
                <span className="text-xl font-extrabold">₹ {totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="h-11 px-6 border-slate-300 font-semibold text-slate-700"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmOrder}
              loading={isProcessing}
              className="h-11 px-8 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm"
            >
              Place Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
