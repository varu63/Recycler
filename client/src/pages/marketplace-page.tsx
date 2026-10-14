import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MaterialOffer {
  id: string;
  name: string;
  category: string;
  quantity: number;
  pricePerKg: number;
  location: string;
  verified: boolean;
  image: string;
  description: string;
}

export const SAMPLE_OFFERS: MaterialOffer[] = [
  {
    id: 'mat-copper-01',
    name: 'Copper',
    category: 'Copper',
    quantity: 500,
    pricePerKg: 600,
    location: 'Delhi, India',
    verified: true,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtG9_m0RUxtj10_4Gfdnz6UD-GTA9hWs4TQsHr6MrGmE3XENNmg0S8MFQ&s=10',
    description: 'High quality pure copper scrap, clean and sorted. Suitable for recycling and industrial use.',
  },
  {
    id: 'mat-aluminium-02',
    name: 'Aluminium',
    category: 'Aluminium',
    quantity: 1000,
    pricePerKg: 220,
    location: 'Ahmedabad, India',
    verified: true,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU3ejVB6w5ApIMLud73BruG0pwSeV4QOsZSQSVFNz971gbJJdrQQT9m-O8&s=10',
    description: 'High grade sorted aluminium extrusions and wire scrap ready for smelting.',
  },
  {
    id: 'mat-steel-03',
    name: 'Steel',
    category: 'Steel',
    quantity: 750,
    pricePerKg: 75,
    location: 'Mumbai, India',
    verified: true,
    image: 'https://jsw-steel-s3.s3.ap-south-1.amazonaws.com/jsw-steel-images/uploads/2026/06/big-what-is-Steel-100626.jpg',
    description: 'Heavy melting steel scrap (HMS 1 & 2), clean, decontaminated, and ready for shipment.',
  },
  {
    id: 'mat-brass-04',
    name: 'Brass',
    category: 'Brass',
    quantity: 300,
    pricePerKg: 480,
    location: 'Delhi, India',
    verified: true,
    image: 'https://www.australwright.com.au/wp-content/uploads/2025/05/brass-rod.png',
    description: 'Yellow and honey brass scrap solids, free from iron contaminants.',
  },
  {
    id: 'mat-plastic-05',
    name: 'Plastic',
    category: 'Plastic',
    quantity: 500,
    pricePerKg: 120,
    location: 'Pune, India',
    verified: true,
    image: 'https://suryamb.com/wp-content/uploads/2025/11/7xbxqApaMCnyc1Db3tKf3BXUv1leD9DX9gKub9qL.webp',
    description: 'Baled HDPE and PET flakes washed, granulated, and color separated.',
  },
  {
    id: 'mat-iron-06',
    name: 'Iron',
    category: 'Iron',
    quantity: 1200,
    pricePerKg: 55,
    location: 'Kolkata, India',
    verified: true,
    image: 'https://5.imimg.com/data5/SELLER/Default/2023/7/322341346/UP/CE/OJ/190756992/iron-ingot-500x500.jpg',
    description: 'Clean cast iron scrap and machinery parts ready for furnace loading.',
  },
];

const CATEGORIES = [
  'All',
  'Iron',
  'Steel',
  'Aluminium',
  'Copper',
  'Brass',
  'Plastic',
  'Paper',
  'Cardboard',
  'Glass',
  'Other',
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');

  const filteredOffers = useMemo(() => {
    return SAMPLE_OFFERS.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchLocation =
        selectedLocation === 'all' || item.location.toLowerCase().includes(selectedLocation.toLowerCase());
      return matchSearch && matchCategory && matchLocation;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePerKg - b.pricePerKg;
      if (sortBy === 'price_desc') return b.pricePerKg - a.pricePerKg;
      return 0; // latest
    });
  }, [search, selectedCategory, selectedLocation, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header matching Screen 5 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buy Material</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select the material you need and find the best offers.
        </p>
      </div>

      {/* Search Bar & Location Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material..."
            className="pl-10 h-11 bg-white border-slate-200 text-sm shadow-sm rounded-xl"
          />
        </div>

        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-full sm:w-56 h-11 bg-white border-slate-200 text-sm shadow-sm rounded-xl">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Your Location" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="delhi">Delhi, India</SelectItem>
            <SelectItem value="mumbai">Mumbai, India</SelectItem>
            <SelectItem value="ahmedabad">Ahmedabad, India</SelectItem>
            <SelectItem value="pune">Pune, India</SelectItem>
            <SelectItem value="kolkata">Kolkata, India</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills Bar matching Screen 5 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                isActive
                  ? 'bg-amber-100/90 text-amber-900 border-amber-400 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Available Offers Header & Sort */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-base font-bold text-slate-900">Available Offers</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Offers Cards matching Screen 5 layout */}
      <div className="space-y-4">
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <p className="text-sm font-medium">No material offers match your filter criteria.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedLocation('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                <img
                  src={offer.image}
                  alt={offer.name}
                  className="h-28 w-36 object-cover rounded-xl shadow-sm border border-slate-100 shrink-0"
                />
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-bold text-slate-900">{offer.name}</h3>
                    {offer.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Seller
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Quantity: <span className="font-semibold text-slate-700">{offer.quantity.toLocaleString()} kg</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Price: <span className="font-bold text-slate-900">₹ {offer.pricePerKg} / kg</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Location: <span className="text-slate-600">{offer.location}</span>
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-[#0F284E] hover:bg-[#163566] text-white font-semibold text-xs px-6 h-10 rounded-xl shadow-sm"
                >
                  <Link to={`/marketplace/${offer.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
