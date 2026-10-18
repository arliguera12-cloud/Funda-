const LOCALE = 'es-419';

export function usd(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 4 : n < 100 ? 3 : 2,
  }).format(n);
}

export function compact(n: number | null | undefined, currency = true): string {
  if (n == null) return '—';
  return new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 2,
    ...(currency ? { style: 'currency', currency: 'USD' } : {}),
  }).format(n);
}

export function pct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function timeAgo(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'hace unos segundos';
  const m = Math.round(s / 60);
  return m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`;
}
