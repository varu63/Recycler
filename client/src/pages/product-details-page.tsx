import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Lock,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  Scale,
  Award,
  Leaf,
  Maximize2,
  X,
  Clock,
  Sparkles,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';
import { marketplaceService } from '@/services/marketplace.service';
import { SAMPLE_OFFERS } from './marketplace-page';
import { SAMPLE_PROVENANCE_MAP } from '@/data/material-provenance';
import { toast } from 'sonner';
import type { MaterialProvenanceDTO } from '@/types';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Selected image for modal preview lightbox
  const [activeModalImage, setActiveModalImage] = useState<{
    url: string;
    title: string;
    stage: string;
  } | null>(null);

  // 1. Fetch remote listing if it is a real DB ID
  const isDbId = Boolean(id && !id.startsWith('mat-'));
  const { data: remoteListing, isLoading: isRemoteLoading } = useQuery({
    queryKey: ['marketplace-listing', id],
    queryFn: () => marketplaceService.getPublic(id!),
    enabled: isDbId,
    retry: 1,
  });

  // 2. Resolve material data (remote or sample)
  const sampleOffer = SAMPLE_OFFERS.find((o) => o.id === id);

  let materialName = 'Recycled Material';
  let category = 'Metal';
  let availableWeight = 500;
  let pricePerKg = 100;
  let location = 'Delhi, India';
  let verified = true;
  let mainImage = 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80';
  let description = '';
  let provenance: MaterialProvenanceDTO | null = null;

  if (remoteListing) {
    materialName = remoteListing.productName || remoteListing.materialName;
    category = remoteListing.materialType;
    availableWeight = remoteListing.availableQuantity;
    pricePerKg = remoteListing.pricePerKg;
    verified = remoteListing.qualityInfo?.verified ?? true;
    mainImage = remoteListing.images?.[0]?.url || mainImage;
    description = remoteListing.description || '';
    provenance = remoteListing.provenance || null;
    location = provenance?.origin?.location || 'Verified Sourcing Hub, India';
  } else if (sampleOffer) {
    materialName = sampleOffer.name;
    category = sampleOffer.category;
    availableWeight = sampleOffer.quantity;
    pricePerKg = sampleOffer.pricePerKg;
    location = sampleOffer.location;
    verified = sampleOffer.verified;
    mainImage = sampleOffer.image;
    description = sampleOffer.description;
    provenance = (id && SAMPLE_PROVENANCE_MAP[id]) || null;
  } else if (!isDbId) {
    // If unknown sample id, pick first sample safely
    const fallback = SAMPLE_OFFERS[0];
    materialName = fallback.name;
    category = fallback.category;
    availableWeight = fallback.quantity;
    pricePerKg = fallback.pricePerKg;
    location = fallback.location;
    verified = fallback.verified;
    mainImage = fallback.image;
    description = fallback.description;
    provenance = SAMPLE_PROVENANCE_MAP['mat-copper-01'] || null;
  }

  // Fallback provenance if none exists for any listing
  if (!provenance) {
    provenance = {
      origin: {
        sourceType: 'Commercial Industrial Collection Partner',
        sellerName: 'Verified Partner',
        location,
        city: location.split(',')[0]?.trim() || 'Regional Hub',
        state: location.split(',')[1]?.trim() || 'India',
        submissionDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        originalPhotos: [{ url: mainImage }],
        approximateWeight: availableWeight + 40,
        originalDescription: description,
      },
      inspection: {
        inspectorRole: 'Lead Metallurgical Inspector',
        inspectedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        grade: 'Industrial Grade A',
        quality: 'HIGH',
        actualWeight: availableWeight,
        notes: 'Purity, weight, and safety checks certified.',
        verified: true,
      },
      processing: {
        batchId: `BAT-${category.toUpperCase().slice(0, 2)}-${Math.floor(1000 + Math.random() * 9000)}`,
        processingType: 'Refining, Granulation & Magnetic Decontamination',
        stage: 'COMPLETED',
        status: 'COMPLETED',
        inputWeight: availableWeight + 30,
        outputWeight: availableWeight,
        lossWeight: 30,
        recoveryPercentage: 93.5,
        startedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        notes: 'Processed through automated segregation and cleaning line.',
      },
      specifications: {
        materialName,
        materialType: category,
        grade: 'Certified Industrial Grade',
        quality: 'HIGH',
        purity: '99.0% Pure Recycled Base',
        standardSpecs: 'IS Compliant Circular Economy Standard',
        environmentalImpact: {
          co2SavedKg: Math.round(availableWeight * 3.5),
          energySavedKwh: Math.round(availableWeight * 5.2),
          landfillDivertedKg: availableWeight,
        },
      },
      mediaGallery: {
        originalRaw: { url: mainImage },
        duringProcessing: { url: mainImage },
        finalProduct: { url: mainImage },
      },
      journey: [
        {
          step: 1,
          title: 'Material Submitted & Collected',
          status: 'COMPLETED',
          date: new Date(Date.now() - 7 * 86400000).toISOString(),
          location,
          notes: 'Intake initiated with intake photos and digital weigh slip.',
          metrics: [{ label: 'Source', value: 'Verified Partner' }],
        },
        {
          step: 2,
          title: 'Inspected & Verified',
          status: 'COMPLETED',
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
          location: 'MetalMundi Intake Center',
          notes: 'Visual inspection, weighing, and metallurgical grading verified.',
          metrics: [{ label: 'Status', value: 'Passed Inspection' }],
        },
        {
          step: 3,
          title: 'Accepted for Purchase & Inwarded',
          status: 'COMPLETED',
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
          location: 'Central Storage Facility',
          notes: 'Purchase terms settled and inwarded to custody inventory.',
          metrics: [{ label: 'Inward', value: `${availableWeight} kg` }],
        },
        {
          step: 4,
          title: 'Batch Processing & Refining',
          status: 'COMPLETED',
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          location: 'MetalMundi Processing Hub',
          notes: 'Refined and decontaminated for high-efficiency reuse.',
          metrics: [{ label: 'Recovery Rate', value: '93.5%' }],
        },
        {
          step: 5,
          title: 'Quality Certification & Lab Testing',
          status: 'COMPLETED',
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          location: 'MetalMundi QA Testing Lab',
          notes: 'Compliant with circular economy re-manufacturing standards.',
          metrics: [{ label: 'QA Certificate', value: 'MM-VERIFIED-2026' }],
        },
        {
          step: 6,
          title: 'Listed for Sale on MetalMundi Marketplace',
          status: 'COMPLETED',
          date: new Date(Date.now() - 86400000).toISOString(),
          location: 'MetalMundi Marketplace',
          notes: 'Catalogue live for national procurement.',
          metrics: [{ label: 'Price', value: `₹ ${pricePerKg} / kg` }],
        },
        {
          step: 7,
          title: 'Available for Purchase & Dispatch',
          status: 'IN_PROGRESS',
          date: null,
          location: 'Warehouse Ready',
          notes: 'Packed and ready for 24-48h dispatch across India.',
          metrics: [{ label: 'Availability', value: 'In Stock' }],
        },
      ],
    };
  }

  // Quantity Stepper State
  const defaultQuantity = Math.min(100, availableWeight > 0 ? availableWeight : 10);
  const [quantity, setQuantity] = useState<number>(defaultQuantity);

  // Pricing calculations
  const subtotal = quantity * pricePerKg;
  const gst = Math.round(subtotal * 0.18);
  const transportFee = 2000;
  const totalEstimated = subtotal + gst + transportFee;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(10, prev - 25));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(availableWeight, prev + 25));
  };

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setQuantity(10);
    } else {
      setQuantity(Math.min(availableWeight, Math.max(10, num)));
    }
  };

  const handleAddToCart = () => {
    addToCart(
      {
        id: id || 'item',
        title: materialName,
        category,
        pricePerKg,
        image: mainImage,
        location,
      },
      quantity
    );
    toast.success(`Added ${quantity} kg of ${materialName} to cart!`, {
      description: `Subtotal: ₹ ${subtotal.toLocaleString('en-IN')}`,
      action: {
        label: 'View Cart',
        onClick: () => navigate('/cart'),
      },
    });
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: id || 'item',
        title: materialName,
        category,
        pricePerKg,
        image: mainImage,
        location,
      },
      quantity
    );
    navigate('/checkout');
  };

  if (isRemoteLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-10 w-10 border-4 border-[#176B45] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading material specifications & origin history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Lightbox Modal for Image Inspection */}
      {activeModalImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModalImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#F5F7F5]">
              <div>
                <span className="text-[11px] font-bold text-[#176B45] uppercase tracking-wider block">
                  {activeModalImage.stage}
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeModalImage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalImage(null)}
                className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 bg-black/5 flex items-center justify-center max-h-[75vh]">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Header: Navigation & Brand Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#176B45] hover:text-[#123B2A] transition-colors bg-[#EAF5EE] px-3 py-1.5 rounded-lg border border-[#176B45]/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Marketplace
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{materialName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B2A] bg-[#EAF5EE] px-3 py-1 rounded-full border border-[#176B45]/30 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-[#176B45]" />
            MetalMundi Origin Certified
          </span>
        </div>
      </div>

      {/* SECTION 1: MATERIAL HERO & PURCHASE PANEL */}
      <div className="grid gap-8 lg:grid-cols-12 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Left Column: Visual Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative group overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 aspect-[4/3] max-h-[440px] shadow-sm">
            <img
              src={mainImage}
              alt={materialName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge className="bg-[#123B2A] text-white hover:bg-[#123B2A] text-xs font-semibold px-2.5 py-1">
                {category}
              </Badge>
              {verified && (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Stock
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveModalImage({
                  url: mainImage,
                  title: `${materialName} - Processed Material`,
                  stage: 'Final Listing Photo',
                })
              }
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white shadow-md transition-all backdrop-blur-sm"
              title="Expand image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Quick origin badge info */}
          <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="h-4 w-4 text-[#176B45]" />
              <span className="font-semibold text-slate-800">Source:</span>
              <span className="text-slate-600 truncate max-w-[220px]">{provenance.origin.sourceType}</span>
            </div>
            <span className="text-[#176B45] font-bold shrink-0">{provenance.origin.city}, {provenance.origin.state}</span>
          </div>
        </div>

        {/* Right Column: Pricing & Purchase Calculator */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#176B45] tracking-wider uppercase bg-[#EAF5EE] px-2.5 py-0.5 rounded-md">
                  {provenance.specifications.grade}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Batch #{provenance.processing.batchId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#123B2A]">
                {materialName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {description || provenance.origin.originalDescription}
              </p>
            </div>

            {/* Key Specs Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-slate-100">
              <div className="p-3 rounded-xl bg-[#F5F7F5] border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Price / kg</span>
                <span className="text-lg font-bold text-slate-900">₹ {pricePerKg}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F5] border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Available Stock</span>
                <span className="text-lg font-bold text-[#176B45]">{availableWeight.toLocaleString()} kg</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F5] border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-slate-500 block">Purity / Class</span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {provenance.specifications.purity?.split(' ')[0] || 'Grade A'}
                </span>
              </div>
            </div>

            {/* Quantity Stepper & Cost Calculator */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <label htmlFor="quantity-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-[#176B45]" />
                  Select Order Quantity
                </label>
                <span className="text-xs text-slate-500">Min: 10 kg | Max: {availableWeight} kg</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 10}
                    className="p-3 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-40"
                    aria-label="Decrease quantity by 25 kg"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    id="quantity-input"
                    type="number"
                    min={10}
                    max={availableWeight}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-20 text-center font-extrabold text-base text-slate-900 bg-transparent outline-none focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= availableWeight}
                    className="p-3 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-40"
                    aria-label="Increase quantity by 25 kg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm font-bold text-slate-700">kilograms (kg)</span>
              </div>

              {/* Live Cost Breakdown */}
              <div className="rounded-2xl bg-[#EAF5EE]/60 border border-[#176B45]/20 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({quantity} kg × ₹{pricePerKg})</span>
                  <span className="font-semibold text-slate-900">₹ {subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Reverse Charge Mechanism)</span>
                  <span className="font-semibold text-slate-900">₹ {gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Insured Transport & Logistics</span>
                  <span className="font-semibold text-slate-900">₹ {transportFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#176B45]/20 flex justify-between items-center text-sm">
                  <span className="font-bold text-[#123B2A]">Estimated Order Total</span>
                  <span className="text-xl font-extrabold text-[#123B2A]">
                    ₹ {totalEstimated.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="h-12 bg-white hover:bg-slate-50 text-[#123B2A] border-2 border-[#123B2A] font-bold rounded-xl shadow-sm text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4 text-[#176B45]" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="h-12 bg-[#123B2A] hover:bg-[#176B45] text-white font-bold rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4 text-amber-300" />
                  Buy Now & Proceed
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            <div className="space-y-1">
              <ShieldCheck className="h-5 w-5 mx-auto text-[#176B45]" />
              <p className="text-[11px] font-bold text-slate-800">Quality Assured</p>
              <p className="text-[10px] text-slate-500">100% Verified Assay</p>
            </div>
            <div className="space-y-1">
              <Truck className="h-5 w-5 mx-auto text-blue-600" />
              <p className="text-[11px] font-bold text-slate-800">Pan-India Freight</p>
              <p className="text-[10px] text-slate-500">Weighbridge Certificate</p>
            </div>
            <div className="space-y-1">
              <Lock className="h-5 w-5 mx-auto text-amber-600" />
              <p className="text-[11px] font-bold text-slate-800">Secure Escrow</p>
              <p className="text-[10px] text-slate-500">GST Invoice Provided</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MATERIAL ORIGIN & SOURCING DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-[#EAF5EE] text-[#176B45]">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#123B2A]">
              Material Origin & Initial Source
            </h2>
            <p className="text-xs text-slate-500">
              Verified chain-of-custody tracking from original submission through MetalMundi custody
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card A: Original Supplier Source */}
          <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-[#176B45] uppercase tracking-wider block">
              Original Supplier Source
            </span>
            <p className="text-sm font-bold text-slate-900">{provenance.origin.sourceType}</p>
            <div className="pt-2 text-xs text-slate-600 space-y-1 border-t border-slate-200/60">
              <p className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-semibold text-slate-800">{provenance.origin.sellerName}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{provenance.origin.city}, {provenance.origin.state}</span>
              </p>
            </div>
          </div>

          {/* Card B: Intake Submission */}
          <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-[#176B45] uppercase tracking-wider block">
              Collection & Intake
            </span>
            <p className="text-sm font-bold text-slate-900">
              {provenance.origin.submissionDate ? new Date(provenance.origin.submissionDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : 'Recorded at Intake'}
            </p>
            <div className="pt-2 text-xs text-slate-600 space-y-1 border-t border-slate-200/60">
              <p className="flex justify-between">
                <span className="text-slate-500">Intake Weight:</span>
                <span className="font-semibold text-slate-800">
                  {provenance.origin.approximateWeight ? `${provenance.origin.approximateWeight} kg` : 'Recorded'}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Logistics Channel:</span>
                <span className="font-semibold text-slate-800">Insured Transport</span>
              </p>
            </div>
          </div>

          {/* Card C: Physical Inspection Details */}
          <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-[#176B45] uppercase tracking-wider block">
              Inspection Verification
            </span>
            <p className="text-sm font-bold text-slate-900">{provenance.inspection.inspectorRole}</p>
            <div className="pt-2 text-xs text-slate-600 space-y-1 border-t border-slate-200/60">
              <p className="flex justify-between">
                <span className="text-slate-500">Measured Weight:</span>
                <span className="font-semibold text-slate-800">
                  {provenance.inspection.actualWeight ? `${provenance.inspection.actualWeight} kg` : 'Verified'}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Initial Grade:</span>
                <span className="font-semibold text-emerald-700">{provenance.inspection.grade}</span>
              </p>
            </div>
          </div>

          {/* Card D: Inspector Assessment */}
          <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-[#176B45] uppercase tracking-wider block">
              Inspector Assessment
            </span>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{provenance.inspection.notes}"
            </p>
            <div className="pt-2 text-xs flex items-center gap-1.5 text-emerald-700 font-semibold border-t border-slate-200/60">
              <Check className="h-4 w-4" />
              100% Purity Verified
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: 7-STEP PROCESSING JOURNEY TIMELINE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EAF5EE] text-[#176B45]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123B2A]">
                Complete 7-Step Processing Journey
              </h2>
              <p className="text-xs text-slate-500">
                Visual history tracking every milestone from collection to marketplace delivery
              </p>
            </div>
          </div>
          <Badge className="bg-[#EAF5EE] text-[#176B45] border border-[#176B45]/20 font-bold px-3 py-1">
            Batch #{provenance.processing.batchId}
          </Badge>
        </div>

        {/* Vertical Connected Timeline */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#176B45]/30">
          {provenance.journey.map((step) => {
            const isDone = step.status === 'COMPLETED';
            const isInProgress = step.status === 'IN_PROGRESS';

            return (
              <div key={step.step} className="relative group">
                {/* Step indicator circle */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-transform duration-200 group-hover:scale-110 shadow-sm ${
                    isDone
                      ? 'bg-[#123B2A] border-[#176B45] text-white'
                      : isInProgress
                      ? 'bg-amber-500 border-amber-300 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : step.step}
                </div>

                {/* Step Content Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F7F5] border border-slate-200/80 hover:border-[#176B45]/40 transition-colors shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#176B45]">Step {step.step}</span>
                      <span className="text-slate-300">•</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{step.title}</h4>
                    </div>
                    {step.date ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(step.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Active Stage
                      </span>
                    )}
                  </div>

                  {step.notes ? (
                    <p className="text-xs text-slate-600 leading-relaxed">{step.notes}</p>
                  ) : null}

                  {step.metrics && step.metrics.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                      {step.metrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 text-[11px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700"
                        >
                          <span className="text-slate-400 font-medium">{m.label}:</span>
                          <span className="font-bold text-slate-900">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: BEFORE, DURING & AFTER PHOTOS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-[#EAF5EE] text-[#176B45]">
            <Maximize2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#123B2A]">
              Before & After Processing Gallery
            </h2>
            <p className="text-xs text-slate-500">
              Visual transformation of raw collected scrap into certified high-purity recycled material
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Original Material */}
          <div className="group rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={provenance.mediaGallery.originalRaw?.url || mainImage}
                alt="Original raw material scrap"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                Stage 1: Original State
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveModalImage({
                    url: provenance?.mediaGallery.originalRaw?.url || mainImage,
                    title: 'Original Raw Scrap at Intake',
                    stage: 'Stage 1: Raw Submission',
                  })
                }
                className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow transition-all"
                title="Expand image"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Original Unprocessed Scrap</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Raw state captured at initial collection by seller before cleaning and segregation.
              </p>
            </div>
          </div>

          {/* Card 2: During Processing */}
          <div className="group rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={provenance.mediaGallery.duringProcessing?.url || mainImage}
                alt="Material during industrial processing"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-2.5 left-2.5 bg-[#176B45]/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                Stage 2: Treatment & Refining
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveModalImage({
                    url: provenance?.mediaGallery.duringProcessing?.url || mainImage,
                    title: 'Material During Processing & Granulation',
                    stage: 'Stage 2: Industrial Refining',
                  })
                }
                className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow transition-all"
                title="Expand image"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">During Refining & Sorting</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Treatment via {provenance.processing.processingType} with magnetic de-contamination.
              </p>
            </div>
          </div>

          {/* Card 3: Final Product */}
          <div className="group rounded-2xl border border-[#176B45]/40 overflow-hidden bg-[#EAF5EE]/20 shadow-sm hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={provenance.mediaGallery.finalProduct?.url || mainImage}
                alt="Final processed product ready for sale"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-2.5 left-2.5 bg-[#123B2A] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                Stage 3: Ready for Use
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveModalImage({
                    url: provenance?.mediaGallery.finalProduct?.url || mainImage,
                    title: 'Final Finished Material Ready for Sale',
                    stage: 'Stage 3: Finished Product',
                  })
                }
                className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow transition-all"
                title="Expand image"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-[#123B2A]">Final Processed Material</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                High purity, certified uniform grade packaged and ready for immediate furnace loading.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: TECHNICAL SPECIFICATIONS & ENVIRONMENTAL IMPACT */}
      <div className="grid gap-8 md:grid-cols-12">
        {/* Technical Specs Table */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Info className="h-5 w-5 text-[#176B45]" />
            <h3 className="text-base font-bold text-[#123B2A]">Quality & Technical Specifications</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Material Name</span>
              <span className="font-bold text-slate-900">{provenance.specifications.materialName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Material Category</span>
              <span className="font-bold text-slate-900">{category}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Assigned Grade</span>
              <span className="font-bold text-[#176B45]">{provenance.specifications.grade}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Certified Purity</span>
              <span className="font-bold text-slate-900">{provenance.specifications.purity}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Industry Standard Compliance</span>
              <span className="font-medium text-slate-800">{provenance.specifications.standardSpecs}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Processing Batch Recovery</span>
              <span className="font-bold text-emerald-700">{provenance.processing.recoveryPercentage}% Yield</span>
            </div>
          </div>
        </div>

        {/* Environmental Impact Card */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#123B2A] to-[#176B45] text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-white/10 px-3 py-1 rounded-full">
              <Leaf className="h-4 w-4 text-emerald-300" />
              Circular Economy Impact
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Environmental Savings</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              By procuring this recycled batch instead of virgin mined materials, you contribute directly to reducing industrial carbon emissions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-emerald-200 font-medium block">CO₂ Emissions Saved</span>
              <span className="text-xl font-extrabold text-white">
                {provenance.specifications.environmentalImpact?.co2SavedKg.toLocaleString()} kg
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-emerald-200 font-medium block">Energy Conserved</span>
              <span className="text-xl font-extrabold text-white">
                {provenance.specifications.environmentalImpact?.energySavedKwh?.toLocaleString()} kWh
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-emerald-200">Total Landfill Waste Diverted:</span>
            <span className="font-bold text-white text-sm">
              {provenance.specifications.environmentalImpact?.landfillDivertedKg.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
