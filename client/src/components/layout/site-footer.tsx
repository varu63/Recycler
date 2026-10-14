import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { ASSETS } from '@/assets';

const columns = [
  {
    title: 'Company',
    links: [
      { to: '/', label: 'Home' },
      { to: '/marketplace', label: 'Marketplace' },
      { to: '/register', label: 'Partner with us' },
    ],
  },
  {
    title: 'For sellers',
    links: [
      { to: '/sell-material', label: 'Sell waste material' },
      { to: '/my-requests', label: 'My requests' },
      { to: '/my-orders', label: 'My orders' },
    ],
  },
  {
    title: 'For buyers',
    links: [
      { to: '/marketplace', label: 'Buy processed materials' },
      { to: '/login', label: 'Buyer sign in' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-navy text-navy-foreground">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Logo variant="dark" showWordmark />
          <p className="max-w-sm text-sm leading-relaxed text-navy-foreground/70">
            Turn Waste Into Value. We verify, purchase and process waste materials into quality
            raw materials for industry.
          </p>
          <p className="flex items-center gap-2 text-xs text-navy-foreground/60">
            <img src={ASSETS.materials.organic} alt="" className="h-4 w-4 opacity-80" />
            Building a circular economy, one batch at a time.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-foreground/80">
              {column.title}
            </h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link
                    to={link.to}
                    className="text-sm text-navy-foreground/65 transition-colors hover:text-navy-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-foreground/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Material Mundi. All rights reserved.</p>
          <p>Turn Waste Into Value</p>
        </div>
      </div>
    </footer>
  );
}
