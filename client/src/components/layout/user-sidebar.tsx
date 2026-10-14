import {
  Home,
  Tag,
  ShoppingBag,
  Layers,
  ClipboardList,
  User,
  LogOut,
  ShoppingCart,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UserSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/sell-material', label: 'Sell Material', icon: Tag },
  { to: '/marketplace', label: 'Buy Material', icon: ShoppingBag },
  { to: '/my-listings', label: 'My Listings', icon: Layers },
  { to: '/my-orders', label: 'My Orders', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: User },
];

export function UserSidebar({ onNavigate, collapsed = false }: UserSidebarProps) {
  const { logout } = useAuth();
  const { itemCount } = useCart();
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
        <NavLink to="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <Logo variant="dark" showWordmark={!collapsed} />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1.5 px-2 py-4" aria-label="User sidebar navigation">
        {navItems.map((item) => (
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

        <NavLink
          to="/cart"
          onClick={onNavigate}
          title={collapsed ? 'Cart' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2' : '',
              isActive
                ? 'bg-[#EAF5EE] text-[#176B45] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            )
          }
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cart</span>}
          </div>
          {itemCount > 0 && !collapsed ? (
            <span className="rounded-full bg-[#D9A441] px-2 py-0.5 text-xs font-bold text-[#123B2A]">
              {itemCount}
            </span>
          ) : null}
          {itemCount > 0 && collapsed ? (
            <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D9A441] px-1 text-[10px] font-bold text-[#123B2A]">
              {itemCount}
            </span>
          ) : null}
        </NavLink>
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
