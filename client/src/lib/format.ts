const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(
    Number.isFinite(value) ? value : 0
  );
}

export function formatWeight(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (minutes < 60) return rtf.format(Math.sign(diffMs) * minutes, 'minute');
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(Math.sign(diffMs) * hours, 'hour');
  const days = Math.round(abs / 86400000);
  if (days < 30) return rtf.format(Math.sign(diffMs) * days, 'day');
  const months = Math.round(abs / 2592000000);
  if (months < 12) return rtf.format(Math.sign(diffMs) * months, 'month');
  return rtf.format(Math.sign(diffMs) * Math.round(abs / 31536000000), 'year');
}

export function prettifyEnum(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
