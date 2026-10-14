import { useState } from 'react';
import {
  User as UserIcon,
  ChevronRight,
  Lock,
  Bell,
  Globe,
  Trash2,
  Edit2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Varun Tomar',
    email: user?.email || 'varun@example.com',
    mobile: '+91 98765 43210',
    location: 'Delhi, India',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Profile details updated successfully');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
      </div>

      {/* User Header Profile Card matching Screen 11 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#0A192F] text-white text-xl sm:text-2xl font-bold shadow-md">
            {profileData.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{profileData.name}</h2>
            <p className="text-xs text-slate-500 font-medium">{profileData.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="border-slate-300 font-semibold text-xs text-slate-700 h-9 px-4 rounded-xl"
        >
          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Personal Details Form/Card matching Screen 11 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          Personal Information
        </h3>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Name</label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="h-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <Input
                value={profileData.email}
                disabled
                className="h-10 bg-slate-100 border-slate-200 text-sm cursor-not-allowed text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mobile</label>
              <Input
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                className="h-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Location</label>
              <Input
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="h-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
            <Button type="submit" className="bg-[#0F284E] hover:bg-[#163566] text-white text-xs font-bold px-6 h-10 rounded-xl">
              Save Changes
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Name</span>
              <span className="font-semibold text-slate-900">{profileData.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="font-semibold text-slate-900">{profileData.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Mobile</span>
              <span className="font-semibold text-slate-900">{profileData.mobile}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 font-medium">Location</span>
              <span className="font-semibold text-slate-900">{profileData.location}</span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Options List matching Screen 11 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => setPasswordModalOpen(true)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Lock className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Change Password</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setNotificationModalOpen(true)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Bell className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Notification Settings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setLanguageModalOpen(true)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Globe className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Language</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => toast.error('Account deletion request sent to administrator')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-rose-50/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-rose-600">Delete Account</span>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-400" />
        </button>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordModalOpen(false);
              toast.success('Password updated successfully');
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Current Password</label>
              <Input type="password" required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">New Password</label>
              <Input type="password" required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
              <Input type="password" required className="h-10" />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#0F284E] text-white">
                Save Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog open={notificationModalOpen} onOpenChange={setNotificationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-sm text-slate-700">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <span>Order status updates</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <span>Marketplace price alerts</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <span>Email newsletters &amp; reports</span>
              <input type="checkbox" />
            </label>
          </div>
          <DialogFooter>
            <Button onClick={() => setNotificationModalOpen(false)} className="bg-[#0F284E] text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Modal */}
      <Dialog open={languageModalOpen} onOpenChange={setLanguageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Language</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2 text-sm">
            {['English (India)', 'Hindi (हिंदी)', 'Gujarati (ગુજરાતી)', 'Marathi (मराठी)'].map((lang, i) => (
              <label
                key={lang}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
              >
                <span>{lang}</span>
                <input type="radio" name="lang" defaultChecked={i === 0} />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setLanguageModalOpen(false)} className="bg-[#0F284E] text-white">
              Save Language
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
