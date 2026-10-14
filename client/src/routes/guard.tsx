import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/spinner';

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3" role="status">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const { status, isAdmin } = useAuth();

  if (status === 'loading') return <FullPageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
