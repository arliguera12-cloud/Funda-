import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { TOP_IDS, fetchHistory, fetchMarkets, type Coin } from './market';
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

export function MarketProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
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
        const stamps = data.map((c) => Date.parse(c.last_updated ?? '')).filter(Number.isFinite);
        setUpdatedAt(stamps.length ? Math.max(...stamps) : Date.now());
        setError(null);
        // Daily history is cached for 30 min, so this is cheap on most ticks
        const entries = await Promise.all(
          TOP_IDS.map(async (id) => {
            try {
              const closes = (await fetchHistory(id, 90)).map(([, p]) => p);
              const live = data.find((c) => c.id === id)?.current_price;
              if (live && closes.length) closes[closes.length - 1] = live;
              return closes.length ? ([id, analyze(closes)] as const) : null;
            } catch {
              return null;
            }
          }),
        );
        setSignals((prev) => ({ ...prev, ...Object.fromEntries(entries.filter((e) => e !== null)) }));
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
    const t = setInterval(refresh, REFRESH_MS);
    // Phones suspend timers in the background: catch up as soon as the tab is visible again
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return (
    <Ctx.Provider value={{ coins, signals, updatedAt, error, loading: !coins.length && !error, signalsReady, refreshing, refresh }}>
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
