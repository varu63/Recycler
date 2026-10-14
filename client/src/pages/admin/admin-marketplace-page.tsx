import { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
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

interface AdminListingItem {
  id: string;
  material: string;
  seller: string;
  quantity: string;
  price: string;
  status: 'Active' | 'Pending';
  image: string;
}

const SAMPLE_ADMIN_LISTINGS: AdminListingItem[] = [
  {
    id: '1',
    material: 'Copper',
    seller: 'Varun Tomar',
    quantity: '500 kg',
    price: '₹ 600',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    material: 'Aluminium',
    seller: 'Rohan Das',
    quantity: '1,000 kg',
    price: '₹ 220',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    material: 'Steel',
    seller: 'Neha Gupta',
    quantity: '750 kg',
    price: '₹ 75',
    status: 'Pending',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    material: 'Brass',
    seller: 'Amit Singh',
    quantity: '300 kg',
    price: '₹ 480',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '5',
    material: 'Plastic',
    seller: 'Sagar Verma',
    quantity: '500 kg',
    price: '₹ 120',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
  },
];

export default function AdminMarketplacePage() {
  const [materialFilter, setMaterialFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);

  const filteredListings = useMemo(() => {
    return SAMPLE_ADMIN_LISTINGS.filter((item) => {
      const matchSearch =
        item.material.toLowerCase().includes(search.toLowerCase()) ||
        item.seller.toLowerCase().includes(search.toLowerCase());
      const matchMaterial =
        materialFilter === 'all' || item.material.toLowerCase() === materialFilter.toLowerCase();
      const matchStatus =
        statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchMaterial && matchStatus;
    });
  }, [search, materialFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header matching Screen 13 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Listings</h1>
      </div>

      {/* Filter Row matching Screen 13 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={materialFilter} onValueChange={setMaterialFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-white border-slate-200 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            <SelectItem value="copper">Copper</SelectItem>
            <SelectItem value="aluminium">Aluminium</SelectItem>
            <SelectItem value="steel">Steel</SelectItem>
            <SelectItem value="brass">Brass</SelectItem>
            <SelectItem value="plastic">Plastic</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 h-10 bg-white border-slate-200 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by material or seller..."
            className="pl-10 h-10 bg-white border-slate-200 text-xs rounded-xl shadow-none"
          />
        </div>
      </div>

      {/* Listings Table matching Screen 13 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Material</th>
                <th className="py-4 px-6">Seller</th>
                <th className="py-4 px-6">Quantity</th>
                <th className="py-4 px-6">Price (per kg)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No listings found.
                  </td>
                </tr>
              ) : (
                filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Material thumbnail & name */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.material}
                          className="h-10 w-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <span className="font-bold text-slate-900 text-xs">{item.material}</span>
                      </div>
                    </td>

                    {/* Seller Name */}
                    <td className="py-3.5 px-6 text-xs text-slate-700 font-medium">{item.seller}</td>

                    {/* Quantity */}
                    <td className="py-3.5 px-6 text-xs text-slate-600 font-medium">{item.quantity}</td>

                    {/* Price */}
                    <td className="py-3.5 px-6 text-xs font-bold text-slate-900">{item.price}</td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-6">
                      {item.status === 'Active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions View Button */}
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedListing(item)}
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
      <Dialog open={selectedListing !== null} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedListing?.material} Listing</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 pt-2">
              <img
                src={selectedListing.image}
                alt={selectedListing.material}
                className="w-full h-44 object-cover rounded-xl border border-slate-200"
              />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Seller</span>
                  <span className="font-bold text-slate-800">{selectedListing.seller}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-800">{selectedListing.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price per kg</span>
                  <span className="font-bold text-slate-900">{selectedListing.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-800">{selectedListing.status}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
