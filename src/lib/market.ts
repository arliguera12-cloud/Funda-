// Criptomonedas: CoinGecko (API pública, con CORS, sin clave)
import { finite, getJSON, peekCached, type Cached } from './http';

const API = 'https://api.coingecko.com/api/v3';

// Las 5 mayores criptos por capitalización, sin stablecoins
export const TOP_IDS = ['bitcoin', 'ethereum', 'ripple', 'binancecoin', 'solana'];

// CoinGecko puede devolver null en cualquier métrica (p. ej. durante cambios de listado)
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  circulating_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  last_updated?: string | null;
  sparkline_in_7d?: { price: number[] } | null;
}

export type PricePoint = [timestamp: number, price: number];

export function parseMarkets(v: unknown): Coin[] {
  if (!Array.isArray(v)) throw new Error('Respuesta de precios inválida.');
  const coins = v.filter((c): c is Coin => c && typeof c.id === 'string' && finite(c.current_price) && c.current_price > 0);
  if (!coins.length) throw new Error('Respuesta de precios vacía.');
  return coins;
}

export function parseHistory(v: unknown): PricePoint[] {
  const prices = (v as { prices?: unknown })?.prices;
  if (!Array.isArray(prices)) throw new Error('Historial de precios inválido.');
  return prices.filter((p): p is PricePoint => Array.isArray(p) && finite(p[0]) && finite(p[1]) && p[1] > 0);
}

const MARKETS_URL = `${API}/coins/markets?vs_currency=usd&ids=${TOP_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`;
const historyUrl = (id: string, days: number) =>
  `${API}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}${days >= 90 ? '&interval=daily' : ''}`;
// Se guarda como { prices } para conservar la forma de CoinGecko
const parseHistoryEntry = (v: unknown) => ({ prices: parseHistory(v) });

export const fetchMarkets = (force = false): Promise<Cached<Coin[]>> => getJSON(MARKETS_URL, 55_000, parseMarkets, { force });

export async function fetchCryptoHistory(id: string, days: number): Promise<PricePoint[]> {
  const ttl = days === 1 ? 5 * 60_000 : 30 * 60_000;
  return (await getJSON(historyUrl(id, days), ttl, parseHistoryEntry)).v.prices;
}

export const peekMarkets = () => peekCached(MARKETS_URL, parseMarkets);
export const peekCryptoHistory = (id: string, days: number) => peekCached(historyUrl(id, days), parseHistoryEntry)?.v.prices ?? null;
