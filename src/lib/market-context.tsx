import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { TOP_IDS, fetchHistory, fetchMarkets, type Coin } from './market';
import { analyze, type Signal } from './indicators';

interface MarketCtx {
  coins: Coin[];
  signals: Record<string, Signal>;
  updatedAt: number | null;
  error: string | null;
  loading: boolean;
  refresh(): void;
}

const REFRESH_MS = 60_000;
const Ctx = createContext<MarketCtx | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMarkets();
      setCoins(data);
      setUpdatedAt(Date.now());
      setError(null);
      // Daily history is cached for 30 min, so this is cheap on most ticks
      const entries = await Promise.all(
        TOP_IDS.map(async (id) => {
          try {
            const closes = (await fetchHistory(id, 90)).map(([, p]) => p);
            const live = data.find((c) => c.id === id)?.current_price;
            if (live) closes[closes.length - 1] = live;
            return [id, analyze(closes)] as const;
          } catch {
            return null;
          }
        }),
      );
      setSignals((prev) => ({ ...prev, ...Object.fromEntries(entries.filter((e) => e !== null)) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los precios.');
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <Ctx.Provider value={{ coins, signals, updatedAt, error, loading: !coins.length && !error, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}
