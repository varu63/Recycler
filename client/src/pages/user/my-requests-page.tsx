import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ListingItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
  status: 'Active' | 'Pending' | 'Sold';
  image: string;
  location: string;
}

const SAMPLE_LISTINGS: ListingItem[] = [
  {
    id: '1',
    name: 'Copper',
    quantity: '500 kg',
    price: '₹ 600 / kg',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=400&q=80',
    location: 'Delhi, India',
  },
  {
    id: '2',
    name: 'Aluminium',
    quantity: '1,000 kg',
    price: '₹ 220 / kg',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
    location: 'Ahmedabad, India',
  },
  {
    id: '3',
    name: 'Steel',
    quantity: '750 kg',
    price: '₹ 75 / kg',
    status: 'Pending',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
    location: 'Mumbai, India',
  },
  {
    id: '4',
    name: 'Brass Scrap',
    quantity: '300 kg',
    price: '₹ 480 / kg',
    status: 'Sold',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    location: 'Delhi, India',
  },
  {
    id: '5',
    name: 'PET Flakes',
    quantity: '1,200 kg',
    price: '₹ 110 / kg',
    status: 'Sold',
    image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
    location: 'Pune, India',
  },
];

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState<'Active' | 'Pending' | 'Sold'>('Active');
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  const activeCount = SAMPLE_LISTINGS.filter((l) => l.status === 'Active').length;
  const pendingCount = SAMPLE_LISTINGS.filter((l) => l.status === 'Pending').length;
  const soldCount = 5;

  const filteredListings = SAMPLE_LISTINGS.filter((item) => {
    if (activeTab === 'Active') return item.status === 'Active';
    if (activeTab === 'Pending') return item.status === 'Pending';
    return item.status === 'Sold';
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button matching Screen 10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Listings</h1>
        </div>
        <Button asChild className="bg-[#0F284E] hover:bg-[#163566] text-white font-semibold text-xs px-5 h-10 rounded-xl shadow-sm">
          <Link to="/sell-material" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Listing</span>
          </Link>
        </Button>
      </div>

      {/* Tabs Row matching Screen 10 */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('Active')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-1 ${
            activeTab === 'Active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Pending')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-1 ${
            activeTab === 'Pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Sold')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-1 ${
            activeTab === 'Sold'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sold ({soldCount})
        </button>
      </div>

      {/* Table matching Screen 10 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Material</th>
                <th className="py-4 px-6">Quantity</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No listings found in {activeTab}.
                  </td>
                </tr>
              ) : (
                filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-14 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <span className="font-bold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">{item.quantity}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{item.price}</td>
                    <td className="py-4 px-6">
                      {item.status === 'Active' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {item.status === 'Sold' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Sold
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedListing(item)}
                        className="bg-[#0F284E] hover:bg-[#163566] text-white text-xs px-4 h-8 rounded-lg shadow-none"
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
            <DialogTitle>{selectedListing?.name} Details</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 pt-2">
              <img
                src={selectedListing.image}
                alt={selectedListing.name}
                className="w-full h-44 object-cover rounded-xl border border-slate-200"
              />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-slate-800">{selectedListing.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price</span>
                  <span className="font-bold text-slate-900">{selectedListing.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-800">{selectedListing.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-slate-700">{selectedListing.location}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
