import {
  LayoutDashboard,
  Users,
  ListOrdered,
  ShoppingCart,
  Layers,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/marketplace', label: 'Listings', icon: ListOrdered },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/raw-inventory', label: 'Material Management', icon: Layers },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ onNavigate, collapsed = false }: AdminSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-white/10 bg-[#123B2A] text-white shadow-sm transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b border-primary-foreground/10 px-4">
        <NavLink to="/admin" onClick={onNavigate} className="flex items-center gap-2">
          <Logo variant="dark" showWordmark={!collapsed} />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1.5 px-2 py-4" aria-label="Admin sidebar navigation">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2' : '',
                isActive
                  ? 'bg-[#EAF5EE] text-[#176B45] shadow-sm'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center px-2' : ''
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
