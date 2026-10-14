import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, User as UserIcon, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { UserSidebar } from '@/components/layout/user-sidebar';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const displayName = user?.name || '';
  const firstName = displayName.split(' ')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-[#F0FDF4]">
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen lg:block transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <UserSidebar collapsed={sidebarCollapsed} />
      </aside>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open sidebar menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">User Navigation</SheetTitle>
                <UserSidebar onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <Logo showWordmark />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/cart"
              className="relative flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="View Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#176B45] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-accent focus:outline-none"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#176B45] text-xs font-semibold text-white">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium text-foreground sm:inline-block">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-listings">My Listings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main-content" className="flex-1 bg-[#F5F7F5] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}