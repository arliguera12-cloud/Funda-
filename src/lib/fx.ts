// Divisas: tipos de referencia del Banco Central Europeo vía Frankfurter (gratis, con CORS, sin clave).
// Se publican cada día hábil; por eso son datos diarios, no en tiempo real.
import { finite, getJSON, peekCached, type Cached } from './http';
import type { PricePoint } from './market';

const API = 'https://api.frankfurter.dev/v1';

export const FX_CODES = ['EUR', 'MXN', 'BRL', 'GBP', 'JPY'];

export interface FxSeries {
  /** Fechas ISO ascendentes (solo días hábiles). */
  dates: string[];
  /** Unidades de cada moneda por 1 USD. */
  values: Record<string, number[]>;
}

export function parseFx(v: unknown): FxSeries {
  const rates = (v as { rates?: Record<string, Record<string, unknown>> })?.rates;
  if (!rates || typeof rates !== 'object') throw new Error('Respuesta de divisas inválida.');
  const dates = Object.keys(rates).sort();
  const values: Record<string, number[]> = {};
  for (const d of dates) {
    for (const [code, n] of Object.entries(rates[d] ?? {})) if (finite(n) && n > 0) (values[code] ??= []).push(n);
  }
  if (dates.length < 2 || !Object.keys(values).length) throw new Error('Respuesta de divisas vacía.');
  return { dates, values };
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const seriesUrl = (days: number, codes: string[]) => `${API}/${isoDay(Date.now() - days * 864e5)}..?base=USD&symbols=${codes.join(',')}`;
// La fecha cambia cada día: usamos un nombre de caché estable por rango
const cacheKey = (days: number, codes: string[]) => `fx:${days}:${codes.join(',')}`;

export const fetchFx = (force = false): Promise<Cached<FxSeries>> =>
  getJSON(seriesUrl(100, FX_CODES), 30 * 60_000, parseFx, { force, cacheKey: cacheKey(100, FX_CODES) });

export const peekFx = () => peekCached(cacheKey(100, FX_CODES), parseFx);

export async function fetchFxHistory(code: string, days: number): Promise<PricePoint[]> {
  const { v } = await getJSON(seriesUrl(days, [code]), 6 * 3600_000, parseFx, { cacheKey: cacheKey(days, [code]) });
  const vals = v.values[code] ?? [];
  // Un código por petición: las fechas y los valores coinciden uno a uno
  return v.dates.slice(-vals.length).map((d, i): PricePoint => [Date.parse(d), vals[i]]);
}
