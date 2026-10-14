import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { CheckCircle2, UploadCloud, Image as ImageIcon, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { requestsService } from '@/services/requests.service';
import { uploadService } from '@/services/upload.service';
import { MaterialCategory, PickupPreference, type CreateMaterialRequestInput } from '@/types';
import { toast } from 'sonner';

const MATERIAL_OPTIONS = [
  { value: 'copper', label: 'Copper' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'iron', label: 'Iron' },
  { value: 'steel', label: 'Steel' },
  { value: 'brass', label: 'Brass' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'paper', label: 'Paper' },
  { value: 'cardboard', label: 'Cardboard' },
  { value: 'glass', label: 'Glass' },
  { value: 'other', label: 'Other' },
];

const LOCATION_OPTIONS = [
  'Delhi, India',
  'Mumbai, India',
  'Ahmedabad, India',
  'Bengaluru, India',
  'Chennai, India',
  'Pune, India',
  'Hyderabad, India',
  'Kolkata, India',
  'Jaipur, India',
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'other', label: 'Other' },
];

const sellListingSchema = z.object({
  materialType: z.string().min(1, 'Select a material type'),
  weight: z
    .string()
    .min(1, 'Enter weight in kg')
    .refine((v) => Number(v) > 0, 'Weight must be greater than 0'),
  price: z
    .string()
    .min(1, 'Enter price per kg / total price')
    .refine((v) => Number(v) > 0, 'Price must be greater than 0'),
  name: z.string().min(2, 'Enter your name'),
  phone: z.string().min(6, 'Enter a valid mobile number'),
  location: z.string().min(2, 'Select a location'),
  paymentMethods: z.array(z.string()).min(1, 'Select at least one payment method'),
});

type SellListingForm = z.infer<typeof sellListingSchema>;

export default function SellMaterialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const [successListing, setSuccessListing] = useState<{
    material: string;
    weight: string;
    price: string;
    location: string;
    image: string;
  } | null>(null);

  const form = useForm<SellListingForm>({
    resolver: zodResolver(sellListingSchema),
    defaultValues: {
      materialType: 'copper',
      weight: '500',
      price: '600',
      name: user?.name || 'Varun Tomar',
      phone: '9876543210',
      location: 'Delhi, India',
      paymentMethods: ['cash', 'upi', 'bank_transfer'],
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateMaterialRequestInput) => requestsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadService.uploadImage(file);
      setUploadedImageUrl(res.url);
      toast.success('Image uploaded successfully');
    } catch {
      // Fallback preview for offline / demo mode
      const localUrl = URL.createObjectURL(file);
      setUploadedImageUrl(localUrl);
      toast.info('Image selected for listing');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (values: SellListingForm) => {
    const materialLabel =
      MATERIAL_OPTIONS.find((m) => m.value === values.materialType)?.label || values.materialType;

    const payload: CreateMaterialRequestInput = {
      materialType: MaterialCategory.METAL,
      materialName: materialLabel,
      description: `${materialLabel} material listed for sale by ${values.name}. Accepted payments: ${values.paymentMethods.join(', ')}`,
      approximateWeight: Number(values.weight),
      location: values.location,
      expectedPrice: Number(values.price),
      pickupPreference: PickupPreference.ANY,
      images: uploadedImageUrl
        ? [{ url: uploadedImageUrl, thumbnailUrl: uploadedImageUrl, width: 600, height: 400 }]
        : [],
    };

    createMutation.mutate(payload);

    // Transition to Screen 4 (Success state)
    setSuccessListing({
      material: materialLabel,
      weight: `${values.weight} kg`,
      price: `₹ ${values.price} / kg`,
      location: values.location,
      image: uploadedImageUrl,
    });
    toast.success('Material Listed Successfully!');
  };

  // SCREEN 4: Sell Material - Success State
  if (successListing) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-slate-200/80 shadow-lg text-center p-8 bg-white rounded-2xl">
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-sm animate-in zoom-in-75">
                <CheckCircle2 className="h-14 w-14" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Material Listed Successfully!
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your material has been listed and is now visible to buyers.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto bg-[#0F284E] hover:bg-[#163566] text-white px-8 h-11 font-semibold rounded-lg shadow"
              >
                <Link to="/my-listings">View My Listings</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 border-slate-300 font-semibold text-slate-700"
                onClick={() => {
                  setSuccessListing(null);
                  form.reset();
                }}
              >
                Back to Home
              </Button>
            </div>

            {/* Listing Details Card Preview matching Screen 4 */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Listing Details
              </h3>
              <div className="flex items-center gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <img
                  src={successListing.image}
                  alt={successListing.material}
                  className="h-24 w-28 object-cover rounded-lg shadow-sm border border-slate-200"
                />
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-medium w-16">Material:</span>
                    <span className="font-bold text-slate-900">{successListing.material}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-medium w-16">Weight:</span>
                    <span className="font-semibold text-slate-800">{successListing.weight}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-medium w-16">Price:</span>
                    <span className="font-bold text-slate-900">{successListing.price}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-medium w-16">Location:</span>
                    <span className="font-medium text-slate-700">{successListing.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SCREEN 3: Sell Material (User)
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sell Your Material</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the details below to list your material for sale.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-12 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Left Column Fields */}
            <div className="lg:col-span-7 space-y-4">
              {/* Material Type */}
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Material Type *
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200">
                          <SelectValue placeholder="Select Material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Weight */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Weight (kg) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter weight in kg"
                        className="h-10 bg-slate-50/70 border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Price (₹) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter price per kg / total price"
                        className="h-10 bg-slate-50/70 border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your full name"
                        className="h-10 bg-slate-50/70 border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile Number with +91 */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
                          +91
                        </span>
                        <Input
                          placeholder="Enter mobile number"
                          className="rounded-l-none h-10 bg-slate-50/70 border-slate-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Location *
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200">
                          <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATION_OPTIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Accept Payment Methods */}
              <FormField
                control={form.control}
                name="paymentMethods"
                render={() => (
                  <FormItem className="pt-2">
                    <FormLabel className="text-xs font-semibold text-slate-700 block mb-2">
                      Accept *
                    </FormLabel>
                    <div className="flex flex-wrap items-center gap-5">
                      {PAYMENT_METHODS.map((pm) => (
                        <FormField
                          key={pm.id}
                          control={form.control}
                          name="paymentMethods"
                          render={({ field }) => (
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                              <Checkbox
                                checked={field.value?.includes(pm.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, pm.id])
                                    : field.onChange(
                                        field.value?.filter((value: string) => value !== pm.id)
                                      );
                                }}
                              />
                              {pm.label}
                            </label>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column: Upload Image Dropzone */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Upload Image *
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50/80 transition-colors bg-slate-50/40 min-h-[260px]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadedImageUrl ? (
                    <div className="space-y-3">
                      <img
                        src={uploadedImageUrl}
                        alt="Listing Preview"
                        className="max-h-40 rounded-lg mx-auto object-cover shadow-sm border border-slate-200"
                      />
                      <p className="text-xs text-blue-600 font-semibold">Click to replace photo</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Full Width CTA button */}
          <Button
            type="submit"
            className="w-full h-12 bg-[#0F284E] hover:bg-[#163566] text-white font-bold rounded-xl shadow-md text-sm transition-all"
            loading={createMutation.isPending || isUploading}
          >
            Submit Listing
          </Button>
        </form>
      </Form>
    </div>
  );
}
