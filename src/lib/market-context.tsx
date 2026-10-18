import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { TOP_IDS, fetchHistory, fetchMarkets, peekHistory, peekMarkets, type Coin, type PricePoint } from './market';
import { analyze, type Signal } from './indicators';

interface MarketCtx {
  coins: Coin[];
  signals: Record<string, Signal>;
  /** When the data was produced by CoinGecko (not when we fetched it), so cached data reads as old. */
  updatedAt: number | null;
  error: string | null;
  loading: boolean;
  signalsReady: boolean;
  refreshing: boolean;
  refresh(force?: boolean): Promise<void>;
}

const REFRESH_MS = 60_000;
export const STALE_MS = 5 * 60_000;
const Ctx = createContext<MarketCtx | null>(null);

const dataTime = (coins: Coin[]) => {
  const stamps = coins.map((c) => Date.parse(c.last_updated ?? '')).filter(Number.isFinite);
  return stamps.length ? Math.max(...stamps) : null;
};

function signalsFrom(coins: Coin[], history: (id: string) => PricePoint[] | null) {
  const out: Record<string, Signal> = {};
  for (const id of TOP_IDS) {
    const closes = history(id)?.map(([, p]) => p);
    if (!closes?.length) continue;
    const live = coins.find((c) => c.id === id)?.current_price;
    if (live) closes[closes.length - 1] = live;
    out[id] = analyze(closes);
  }
  return out;
}

// RSI moves a hair with every live price; only a visible change (0.1) is worth a re-render
const sameSignal = (a?: Signal, b?: Signal) =>
  !!a && !!b && a.level === b.level && a.score === b.score && a.rsi?.toFixed(1) === b.rsi?.toFixed(1);

export function MarketProvider({ children }: { children: ReactNode }) {
  // Start from the last cached data (marked stale by its own timestamp) instead of empty skeletons
  const [coins, setCoins] = useState<Coin[]>(() => peekMarkets() ?? []);
  const [signals, setSignals] = useState<Record<string, Signal>>(() => signalsFrom(coins, (id) => peekHistory(id, 90)));
  const [updatedAt, setUpdatedAt] = useState<number | null>(() => dataTime(coins));
  const [error, setError] = useState<string | null>(null);
  const [signalsReady, setSignalsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef<Promise<void> | null>(null);

  const refresh = useCallback((force = false) => {
    // One refresh at a time: the interval, tab focus and the manual button can overlap
    if (running.current) return running.current;
    const run = (async () => {
      setRefreshing(true);
      try {
        const data = await fetchMarkets(force);
        setCoins(data);
        setUpdatedAt(dataTime(data) ?? Date.now());
        setError(null);
        // One at a time to avoid a burst against the rate limit; daily history is cached for 30 min
        const histories: Record<string, PricePoint[]> = {};
        for (const id of TOP_IDS) {
          try {
            histories[id] = await fetchHistory(id, 90);
          } catch {
            /* this coin keeps its previous signal */
          }
        }
        const fresh = signalsFrom(data, (id) => histories[id] ?? null);
        // Skip the state update (and a chart re-render) when no signal actually changed
        setSignals((prev) => (Object.keys(fresh).every((id) => sameSignal(prev[id], fresh[id])) ? prev : { ...prev, ...fresh }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No pudimos actualizar los precios.');
      } finally {
        setSignalsReady(true);
        setRefreshing(false);
        running.current = null;
      }
    })();
    running.current = run;
    return run;
  }, []);

  useEffect(() => {
    refresh();
    // Price alerts need polling in background tabs inside the app; the public pages don't
    const t = setInterval(() => (!document.hidden || location.hash.startsWith('#/app')) && refresh(), REFRESH_MS);
    // Phones suspend timers in the background: catch up as soon as the tab is visible again
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return (
    <Ctx.Provider value={{ coins, signals, updatedAt, error, loading: !coins.length && !error, signalsReady: signalsReady || Object.keys(signals).length === TOP_IDS.length, refreshing, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}

/** Re-renders every `ms` so relative times ("hace 2 min") stay current. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
