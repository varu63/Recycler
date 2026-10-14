import { Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F0FDF4]">
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen lg:block transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <AdminSidebar collapsed={collapsed} />
      </aside>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <div className="flex h-16 items-center border-b px-4">
                <Logo showWordmark />
              </div>
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo showWordmark />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
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
