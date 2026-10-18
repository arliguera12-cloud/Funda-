const LOCALE = 'es-419';

const num = (n: number, digits: number) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(n);

export function usd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: n < 1 ? 4 : n < 100 ? 3 : 2,
  }).format(n);
}

// Explicit units: "billón" means 10^12 in Spanish but 10^9 to many dollar users, so never use it
export function compact(n: number | null | undefined, currency = true): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const [div, unit] = Math.abs(n) >= 1e9 ? [1e9, ' mil millones'] : Math.abs(n) >= 1e6 ? [1e6, ' millones'] : [1, ''];
  const v = n / div;
  return `${currency ? '$' : ''}${num(v, div === 1 || Math.abs(v) >= 100 ? 0 : 1)}${unit}`;
}

/** Short price for chart axes: "$114 mil", "$4,100", "$2.45". */
export function axisUsd(n: number): string {
  if (Math.abs(n) >= 1e4) return `$${num(n / 1e3, 1)} mil`;
  return `$${num(n, n >= 100 ? 0 : n >= 1 ? 2 : 4)}`;
}

export function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function timeAgo(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'hace unos segundos';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}
