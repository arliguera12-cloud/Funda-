const API = 'https://api.coingecko.com/api/v3';

// The 5 largest non-stablecoin cryptos by market cap
export const TOP_IDS = ['bitcoin', 'ethereum', 'ripple', 'binancecoin', 'solana'];

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  ath: number;
  ath_change_percentage: number;
  sparkline_in_7d?: { price: number[] };
}

export type PricePoint = [timestamp: number, price: number];

const inflight = new Map<string, Promise<unknown>>();

// Fetch with localStorage cache; serves stale data if the API fails or rate-limits.
async function getJSON<T>(path: string, ttlMs: number): Promise<T> {
  const key = `funda:cg:${path}`;
  let cached: { t: number; v: T } | null = null;
  try {
    cached = JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    /* storage unavailable */
  }
  if (cached && Date.now() - cached.t < ttlMs) return cached.v;
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;

  const req = fetch(API + path)
    .then(async (res) => {
      if (!res.ok) throw new Error(res.status === 429 ? 'Límite de consultas alcanzado, reintentando pronto.' : `Error ${res.status} al consultar precios.`);
      const v = (await res.json()) as T;
      try {
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
      } catch {
        /* quota exceeded: keep working without cache */
      }
      return v;
    })
    .catch((e) => {
      if (cached) return cached.v;
      throw e;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, req);
  return req;
}

export function fetchMarkets(): Promise<Coin[]> {
  return getJSON<Coin[]>(
    `/coins/markets?vs_currency=usd&ids=${TOP_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`,
    55_000,
  );
}

export async function fetchHistory(id: string, days: number | 'max'): Promise<PricePoint[]> {
  const daily = days === 'max' || days >= 90 ? '&interval=daily' : '';
  const ttl = days === 1 ? 5 * 60_000 : 30 * 60_000;
  const data = await getJSON<{ prices: PricePoint[] }>(`/coins/${id}/market_chart?vs_currency=usd&days=${days}${daily}`, ttl);
  return data.prices;
}
