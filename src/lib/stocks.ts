// Bolsa y ETFs: Twelve Data (plan gratuito con clave propia; admite CORS).
// Con VITE_API_PROXY las consultas pasan por el Worker (clave en el servidor y caché compartida).
// Sin proxy ni VITE_TWELVEDATA_KEY esta sección queda desactivada y la app lo explica.
import { finite, getJSON, peekCached, type Cached } from './http';
import type { PricePoint } from './market';

const API = 'https://api.twelvedata.com/time_series';
const KEY = import.meta.env.VITE_TWELVEDATA_KEY as string | undefined;

const PROXY = (import.meta.env.VITE_API_PROXY as string | undefined)?.replace(/\/$/, '');

export const stocksEnabled = !!(PROXY || KEY);
export const STOCK_SYMBOLS = ['SPY', 'QQQ', 'TLT', 'GLD'];

export type StockSeries = Record<string, PricePoint[]>;

/** Acepta la respuesta de varios símbolos ({SPY:{values}}) o de uno solo ({values}). */
export function parseTwelve(v: unknown, symbols: string[]): StockSeries {
  const root = v as Record<string, unknown> | null;
  if (!root || typeof root !== 'object') throw new Error('Respuesta de bolsa inválida.');
  if (root.status === 'error') {
    const code = Number(root.code);
    if (code === 401 || code === 403) throw new Error('La clave de datos de bolsa no es válida.');
    if (code === 429) throw new Error('Se alcanzó el límite de consultas de bolsa. Reintentamos en un minuto.');
    throw new Error('No pudimos obtener los datos de bolsa. Volvemos a intentar en un minuto.');
  }
  const entries: [string, unknown][] = Array.isArray(root.values) ? [[symbols[0], root]] : Object.entries(root);
  const out: StockSeries = {};
  for (const [sym, e] of entries) {
    const values = (e as { values?: unknown })?.values;
    if (!Array.isArray(values)) continue; // un símbolo con error no tumba a los demás
    const pts = values
      .map((r): PricePoint => [Date.parse(String((r as { datetime?: unknown }).datetime)), Number((r as { close?: unknown }).close)])
      .filter((p) => finite(p[0]) && finite(p[1]) && p[1] > 0)
      .sort((a, b) => a[0] - b[0]);
    if (pts.length >= 2) out[sym.toUpperCase()] = pts;
  }
  if (!Object.keys(out).length) throw new Error('Respuesta de bolsa vacía.');
  return out;
}

// La clave va en la URL pero nunca en el nombre de la caché
const url = (symbols: string[], size: number) =>
  PROXY ? `${PROXY}/stocks?symbol=${symbols.join(',')}&outputsize=${size}` : `${API}?symbol=${symbols.join(',')}&interval=1day&outputsize=${size}&apikey=${KEY ?? ''}`;
const cacheKey = (symbols: string[], size: number) => `td:${symbols.join(',')}:${size}`;

export const fetchStocks = (force = false): Promise<Cached<StockSeries>> =>
  getJSON(url(STOCK_SYMBOLS, 90), 30 * 60_000, (v) => parseTwelve(v, STOCK_SYMBOLS), { force, cacheKey: cacheKey(STOCK_SYMBOLS, 90) });

export const peekStocks = () => (stocksEnabled ? peekCached(cacheKey(STOCK_SYMBOLS, 90), (v) => v as StockSeries) : null);

export async function fetchStockHistory(symbol: string, days: number): Promise<PricePoint[]> {
  // outputsize cuenta días de mercado, no calendario: ~252 por año
  const size = Math.ceil(days * (252 / 365)) + 2;
  const { v } = await getJSON(url([symbol], size), 6 * 3600_000, (j) => parseTwelve(j, [symbol]), { cacheKey: cacheKey([symbol], size) });
  return v[symbol.toUpperCase()] ?? [];
}
