import { Leaf, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
}

const publicNav: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Buy Materials' },
];

const userNav: NavItem[] = [
  { to: '/sell-material', label: 'Sell Waste' },
  { to: '/my-requests', label: 'My Requests' },
  { to: '/my-orders', label: 'My Orders' },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
  );
}

export function SiteHeader() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [open, setOpen] = useState(false);

  const links: NavItem[] = [...publicNav, ...(isAuthenticated ? userNav : [])];

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2" aria-label="Material Mundi home">
            <Logo showWordmark />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle asChild>
                  <Link to="/" onClick={close} className="flex items-center gap-2">
                    <Logo showWordmark />
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={navLinkClass}
                    onClick={close}
                  >
                    {item.label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass} onClick={close}>
                    Admin dashboard
                  </NavLink>
                )}
              </nav>
              <Separator />
              <div className="flex flex-col gap-2 p-4">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="h-4 w-4 text-primary" />
                    Signed in as {user?.name}
                  </div>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/login" onClick={close}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register" onClick={close}>
                        Get started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
