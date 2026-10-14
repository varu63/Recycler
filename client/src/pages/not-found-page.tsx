import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
      </div>
      <Link
        to="/"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}
