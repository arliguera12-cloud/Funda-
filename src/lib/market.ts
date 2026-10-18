const API = 'https://api.coingecko.com/api/v3';

// The 5 largest non-stablecoin cryptos by market cap
export const TOP_IDS = ['bitcoin', 'ethereum', 'ripple', 'binancecoin', 'solana'];

// CoinGecko can return null for any metric of a coin (e.g. during listing changes)
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

const inflight = new Map<string, Promise<unknown>>();

function friendlyError(e: unknown, status?: number): Error {
  if (status === 429) return new Error('Hay mucha demanda de precios en este momento. Volvemos a intentar en un minuto.');
  if (status && status >= 500) return new Error('El proveedor de precios no responde. Volvemos a intentar en un minuto.');
  if (e instanceof TypeError) return new Error('Sin conexión a internet. Revisa tu red; volvemos a intentar en un minuto.');
  return new Error('No pudimos actualizar los precios. Volvemos a intentar en un minuto.');
}

// Fetch with localStorage cache; serves stale data if the API fails or rate-limits.
async function getJSON<T>(path: string, ttlMs: number, validate: (v: unknown) => T, force = false): Promise<T> {
  const key = `funda:cg:${path}`;
  let cached: { t: number; v: T } | null = null;
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (raw && typeof raw.t === 'number') cached = { t: raw.t, v: validate(raw.v) };
  } catch {
    /* storage unavailable or corrupt cache entry */
  }
  if (!force && cached && Date.now() - cached.t < ttlMs) return cached.v;
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;

  const req = (async () => {
    let res: Response;
    try {
      res = await fetch(API + path);
    } catch (e) {
      throw friendlyError(e);
    }
    if (!res.ok) throw friendlyError(null, res.status);
    const v = validate(await res.json());
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
    } catch {
      /* quota exceeded: keep working without cache */
    }
    return v;
  })()
    .catch((e) => {
      if (cached) return cached.v;
      throw e instanceof Error && !(e instanceof SyntaxError) ? e : friendlyError(e);
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, req);
  return req;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

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

export function fetchMarkets(force = false): Promise<Coin[]> {
  return getJSON(
    `/coins/markets?vs_currency=usd&ids=${TOP_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`,
    55_000,
    parseMarkets,
    force,
  );
}

export async function fetchHistory(id: string, days: number): Promise<PricePoint[]> {
  const daily = days >= 90 ? '&interval=daily' : '';
  const ttl = days === 1 ? 5 * 60_000 : 30 * 60_000;
  // Stored as { prices } so the cache keeps CoinGecko's shape
  const data = await getJSON(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}${daily}`, ttl, (v) => ({
    prices: parseHistory(v),
  }));
  return data.prices;
}
