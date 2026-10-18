import { compact, pct, usd } from './format';
import type { Coin, PricePoint } from './market';
import type { FxSeries } from './fx';
import type { StockSeries } from './stocks';
import { TOP_IDS } from './market';
import { FX_CODES } from './fx';
import { STOCK_SYMBOLS } from './stocks';

export type AssetKind = 'cripto' | 'divisa' | 'bolsa';

export interface Range {
  label: string;
  days: number;
}

export const KIND_META: Record<
  AssetKind,
  { label: string; long: string; blurb: string; ranges: Range[]; signal: boolean; changeLabel: string; defaultRange: number }
> = {
  cripto: {
    label: 'Cripto',
    long: 'Criptomonedas',
    blurb: 'Dinero digital. Precios en vivo, muy volátiles.',
    ranges: [
      { label: '24 h', days: 1 },
      { label: '7 d', days: 7 },
      { label: '30 d', days: 30 },
      { label: '90 d', days: 90 },
      { label: '1 año', days: 365 },
    ],
    signal: true,
    changeLabel: '24 h',
    defaultRange: 7,
  },
  divisa: {
    label: 'Divisas',
    long: 'Divisas',
    blurb: 'Cuánto vale tu dólar en otras monedas. Dato diario del Banco Central Europeo.',
    ranges: [
      { label: '1 mes', days: 30 },
      { label: '3 meses', days: 90 },
      { label: '1 año', days: 365 },
    ],
    signal: false,
    changeLabel: '1 d',
    defaultRange: 90,
  },
  bolsa: {
    label: 'Bolsa y ETFs',
    long: 'Bolsa, ETFs y bonos',
    blurb: 'Empresas, bonos y oro a través de fondos cotizados. Cierre diario.',
    ranges: [
      { label: '1 mes', days: 30 },
      { label: '3 meses', days: 90 },
      { label: '1 año', days: 365 },
    ],
    signal: true,
    changeLabel: '1 d',
    defaultRange: 90,
  },
};

export const KINDS: AssetKind[] = ['cripto', 'bolsa', 'divisa'];

export interface AssetDef {
  id: string;
  kind: AssetKind;
  symbol: string;
  name: string;
  tagline: string;
  /** Cómo se escribe el precio: dólares o unidades de la moneda por 1 USD. */
  unit: 'usd' | 'rate';
}

export const CATALOG: AssetDef[] = [
  { id: 'bitcoin', kind: 'cripto', symbol: 'BTC', name: 'Bitcoin', tagline: 'El oro digital', unit: 'usd' },
  { id: 'ethereum', kind: 'cripto', symbol: 'ETH', name: 'Ethereum', tagline: 'La computadora mundial', unit: 'usd' },
  { id: 'ripple', kind: 'cripto', symbol: 'XRP', name: 'XRP', tagline: 'Pagos internacionales rápidos', unit: 'usd' },
  { id: 'binancecoin', kind: 'cripto', symbol: 'BNB', name: 'BNB', tagline: 'El motor del ecosistema Binance', unit: 'usd' },
  { id: 'solana', kind: 'cripto', symbol: 'SOL', name: 'Solana', tagline: 'Velocidad y bajo costo', unit: 'usd' },
  { id: 'spy', kind: 'bolsa', symbol: 'SPY', name: 'S&P 500', tagline: 'Las 500 mayores empresas de EE. UU.', unit: 'usd' },
  { id: 'qqq', kind: 'bolsa', symbol: 'QQQ', name: 'Nasdaq 100', tagline: 'Las grandes tecnológicas', unit: 'usd' },
  { id: 'tlt', kind: 'bolsa', symbol: 'TLT', name: 'Bonos del Tesoro 20+', tagline: 'Préstamos al gobierno de EE. UU.', unit: 'usd' },
  { id: 'gld', kind: 'bolsa', symbol: 'GLD', name: 'Oro', tagline: 'El refugio de siempre', unit: 'usd' },
  { id: 'eur', kind: 'divisa', symbol: 'EUR', name: 'Euro', tagline: 'Tu dólar en euros', unit: 'rate' },
  { id: 'mxn', kind: 'divisa', symbol: 'MXN', name: 'Peso mexicano', tagline: 'Tu dólar en pesos mexicanos', unit: 'rate' },
  { id: 'brl', kind: 'divisa', symbol: 'BRL', name: 'Real brasileño', tagline: 'Tu dólar en reales', unit: 'rate' },
  { id: 'gbp', kind: 'divisa', symbol: 'GBP', name: 'Libra esterlina', tagline: 'Tu dólar en libras', unit: 'rate' },
  { id: 'jpy', kind: 'divisa', symbol: 'JPY', name: 'Yen japonés', tagline: 'Tu dólar en yenes', unit: 'rate' },
];

export const defOf = (id: string) => CATALOG.find((a) => a.id === id);
export const isKnownAsset = (id: string) => !!defOf(id);

export interface Asset extends AssetDef {
  price: number;
  /** Cambio del último día (24 h en cripto) y de 7 días, en %. */
  change1d: number | null;
  change7d: number | null;
  /** Línea corta para la mini-gráfica. */
  spark: number[];
  /** Cierres diarios (~90) para calcular la señal. */
  closes: number[];
  image?: string;
  rank?: number | null;
  stats: [label: string, value: string][];
  /** Fecha del dato cuando es diario (ISO) para mostrarla. */
  asOf?: string;
}

/** Precio con su unidad: "$112,000.00" o "0.8605 EUR". */
export function fmtPrice(a: Pick<AssetDef, 'unit' | 'symbol'>, v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return a.unit === 'usd' ? usd(v) : `${new Intl.NumberFormat('es-419', { maximumFractionDigits: v >= 100 ? 2 : v >= 10 ? 3 : 4, minimumFractionDigits: v >= 100 ? 2 : v >= 10 ? 3 : 4 }).format(v)} ${a.symbol}`;
}

const chg = (last: number, prev: number | undefined) => (prev && prev > 0 ? (last / prev - 1) * 100 : null);

/** Valor de hace ~7 días calendario en una serie diaria con fechas (ignora fines de semana). */
function weekAgo(dates: string[], vals: number[]): number | undefined {
  const target = Date.parse(dates[dates.length - 1]) - 7 * 864e5;
  for (let i = dates.length - 1; i >= 0; i--) if (Date.parse(dates[i]) <= target) return vals[i];
  return undefined;
}

export function cryptoAssets(coins: Coin[], histories: Record<string, PricePoint[]> = {}): Asset[] {
  return TOP_IDS.flatMap((id) => {
    const coin = coins.find((c) => c.id === id);
    const def = defOf(id);
    if (!coin || !def) return [];
    const closes = (histories[id] ?? []).map(([, p]) => p);
    if (closes.length) closes[closes.length - 1] = coin.current_price;
    const stats: Asset['stats'] = [
      ['Valor de mercado', compact(coin.market_cap)],
      ['Volumen 24 h', compact(coin.total_volume)],
      ['Máximo 24 h', usd(coin.high_24h)],
      ['Mínimo 24 h', usd(coin.low_24h)],
      ['Máximo histórico', usd(coin.ath)],
      ['Distancia del máximo', pct(coin.ath_change_percentage)],
      ['Oferta circulante', `${compact(coin.circulating_supply, false)} ${coin.symbol.toUpperCase()}`],
      ['Ranking', coin.market_cap_rank ? `#${coin.market_cap_rank}` : '—'],
    ];
    return [
      {
        ...def,
        price: coin.current_price,
        change1d: coin.price_change_percentage_24h ?? null,
        change7d: coin.price_change_percentage_7d_in_currency ?? null,
        spark: coin.sparkline_in_7d?.price ?? [],
        closes,
        image: coin.image,
        rank: coin.market_cap_rank,
        stats,
      },
    ];
  });
}

const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-419', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function fxAssets(s: FxSeries): Asset[] {
  return FX_CODES.flatMap((code) => {
    const def = defOf(code.toLowerCase());
    const vals = s.values[code];
    if (!def || !vals || vals.length < 2) return [];
    const dates = s.dates.slice(-vals.length);
    const last = vals[vals.length - 1];
    const hi = Math.max(...vals);
    const lo = Math.min(...vals);
    return [
      {
        ...def,
        price: last,
        change1d: chg(last, vals[vals.length - 2]),
        change7d: chg(last, weekAgo(dates, vals)),
        spark: vals.slice(-30),
        closes: vals,
        asOf: dates[dates.length - 1],
        stats: [
          ['1 USD en ' + code, fmtPrice(def, last)],
          [`1 ${code} en USD`, usd(1 / last)],
          ['Máximo (≈ 90 días)', fmtPrice(def, hi)],
          ['Mínimo (≈ 90 días)', fmtPrice(def, lo)],
          ['Variación (≈ 90 días)', pct(chg(last, vals[0]))],
          ['Dato del', dayLabel(dates[dates.length - 1])],
        ],
      },
    ];
  });
}

export function stockAssets(s: StockSeries): Asset[] {
  return STOCK_SYMBOLS.flatMap((sym) => {
    const def = defOf(sym.toLowerCase());
    const pts = s[sym];
    if (!def || !pts || pts.length < 2) return [];
    const vals = pts.map(([, p]) => p);
    const dates = pts.map(([t]) => new Date(t).toISOString().slice(0, 10));
    const last = vals[vals.length - 1];
    const hi = Math.max(...vals);
    const lo = Math.min(...vals);
    return [
      {
        ...def,
        price: last,
        change1d: chg(last, vals[vals.length - 2]),
        change7d: chg(last, weekAgo(dates, vals)),
        spark: vals.slice(-30),
        closes: vals,
        asOf: dates[dates.length - 1],
        stats: [
          ['Último cierre', usd(last)],
          ['Máximo (≈ 90 días)', usd(hi)],
          ['Mínimo (≈ 90 días)', usd(lo)],
          ['Variación (≈ 90 días)', pct(chg(last, vals[0]))],
          ['Distancia del máximo', pct(chg(last, hi))],
          ['Dato del', dayLabel(dates[dates.length - 1])],
        ],
      },
    ];
  });
}
