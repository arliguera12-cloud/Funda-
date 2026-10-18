import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KINDS, cryptoAssets, fxAssets, stockAssets, type Asset, type AssetKind } from './assets';
import { fetchFx, peekFx, type FxSeries } from './fx';
import { analyze, type Signal } from './indicators';
import { TOP_IDS, fetchCryptoHistory, fetchMarkets, peekCryptoHistory, peekMarkets, type Coin, type PricePoint } from './market';
import { fetchStocks, peekStocks, stocksEnabled, type StockSeries } from './stocks';
import { KIND_META } from './assets';

export interface KindStatus {
  state: 'cargando' | 'ok' | 'error' | 'sin-clave';
  error: string | null;
  /** Cripto: momento del dato en CoinGecko. Divisas y bolsa: cuándo lo descargamos. */
  updatedAt: number | null;
  /** Se está mostrando una copia vieja porque falló la red. */
  stale: boolean;
}

interface MarketCtx {
  assets: Asset[];
  signals: Record<string, Signal>;
  status: Record<AssetKind, KindStatus>;
  /** Atajos del canal principal (cripto, en vivo): los usan el encabezado y las alertas. */
  updatedAt: number | null;
  error: string | null;
  /** Aún no hay nada que mostrar ni error. */
  loading: boolean;
  signalsReady: boolean;
  refreshing: boolean;
  refresh(force?: boolean): Promise<void>;
}

const REFRESH_MS = 60_000;
export const STALE_MS = 5 * 60_000;
/** Los datos diarios solo cambian una vez al día (y no los fines de semana). */
export const DAILY_STALE_MS = 4 * 24 * 3600_000;
const Ctx = createContext<MarketCtx | null>(null);

const dataTime = (coins: Coin[]) => {
  const stamps = coins.map((c) => Date.parse(c.last_updated ?? '')).filter(Number.isFinite);
  return stamps.length ? Math.max(...stamps) : null;
};

const initialStatus = (): Record<AssetKind, KindStatus> => ({
  cripto: { state: 'cargando', error: null, updatedAt: null, stale: false },
  divisa: { state: 'cargando', error: null, updatedAt: null, stale: false },
  bolsa: { state: stocksEnabled ? 'cargando' : 'sin-clave', error: null, updatedAt: null, stale: false },
});

/** ¿Los datos de este tipo son demasiado viejos para fiarse (p. ej. para disparar alertas)? */
export function isStale(kind: AssetKind, st: KindStatus, now = Date.now()): boolean {
  if (!st.updatedAt) return true;
  return now - st.updatedAt > (kind === 'cripto' ? STALE_MS : DAILY_STALE_MS) || st.stale;
}

export function MarketProvider({ children }: { children: ReactNode }) {
  // Arrancamos con lo último guardado (marcado como viejo por su propia hora) en vez de esqueletos vacíos
  const [crypto, setCrypto] = useState(() => {
    const m = peekMarkets();
    const h: Record<string, PricePoint[]> = {};
    for (const id of TOP_IDS) {
      const p = peekCryptoHistory(id, 90);
      if (p) h[id] = p;
    }
    return { coins: m?.v ?? ([] as Coin[]), histories: h };
  });
  const [fx, setFx] = useState<FxSeries | null>(() => peekFx()?.v ?? null);
  const [stocks, setStocks] = useState<StockSeries | null>(() => peekStocks()?.v ?? null);
  const [status, setStatus] = useState(() => {
    const s = initialStatus();
    const m = peekMarkets();
    if (m) s.cripto = { state: 'ok', error: null, updatedAt: dataTime(m.v) ?? m.t, stale: false };
    const f = peekFx();
    if (f) s.divisa = { state: 'ok', error: null, updatedAt: f.t, stale: false };
    const st = peekStocks();
    if (st) s.bolsa = { state: 'ok', error: null, updatedAt: st.t, stale: false };
    return s;
  });
  const [signalsReady, setSignalsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef<Promise<void> | null>(null);

  const patch = useCallback((kind: AssetKind, p: Partial<KindStatus>) => setStatus((s) => ({ ...s, [kind]: { ...s[kind], ...p } })), []);
  const fail = useCallback(
    (kind: AssetKind, e: unknown) => patch(kind, { state: 'error', error: e instanceof Error ? e.message : 'No pudimos actualizar los datos.' }),
    [patch],
  );

  const loadCrypto = useCallback(
    async (force: boolean) => {
      try {
        const { v: coins, t } = await fetchMarkets(force);
        patch('cripto', { state: 'ok', error: null, updatedAt: dataTime(coins) ?? t, stale: false });
        setCrypto((c) => ({ ...c, coins }));
        // De una en una para no ráfagas contra el límite de consultas; el historial diario se guarda 30 min
        for (const id of TOP_IDS) {
          try {
            const h = await fetchCryptoHistory(id, 90);
            setCrypto((c) => ({ ...c, histories: { ...c.histories, [id]: h } }));
          } catch {
            /* esa moneda conserva su señal anterior */
          }
        }
      } catch (e) {
        fail('cripto', e);
      }
    },
    [fail, patch],
  );

  const loadFx = useCallback(
    async (force: boolean) => {
      try {
        const r = await fetchFx(force);
        setFx(r.v);
        patch('divisa', { state: 'ok', error: null, updatedAt: r.t, stale: r.stale });
      } catch (e) {
        fail('divisa', e);
      }
    },
    [fail, patch],
  );

  const loadStocks = useCallback(
    async (force: boolean) => {
      if (!stocksEnabled) return;
      try {
        const r = await fetchStocks(force);
        setStocks(r.v);
        patch('bolsa', { state: 'ok', error: null, updatedAt: r.t, stale: r.stale });
      } catch (e) {
        fail('bolsa', e);
      }
    },
    [fail, patch],
  );

  const refresh = useCallback(
    (force = false) => {
      // Una actualización a la vez: el intervalo, el foco de la pestaña y el botón pueden coincidir
      if (running.current) return running.current;
      const run = (async () => {
        setRefreshing(true);
        try {
          await Promise.all([loadCrypto(force), loadFx(force), loadStocks(force)]);
        } finally {
          setSignalsReady(true);
          setRefreshing(false);
          running.current = null;
        }
      })();
      running.current = run;
      return run;
    },
    [loadCrypto, loadFx, loadStocks],
  );

  useEffect(() => {
    refresh();
    // Las alertas necesitan consultar en segundo plano dentro de la app; las páginas públicas no
    const t = setInterval(() => (!document.hidden || location.hash.startsWith('#/app')) && refresh(), REFRESH_MS);
    // Los teléfonos suspenden los temporizadores: nos ponemos al día al volver a la pestaña
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const assets = useMemo(
    () => [...cryptoAssets(crypto.coins, crypto.histories), ...(stocks ? stockAssets(stocks) : []), ...(fx ? fxAssets(fx) : [])],
    [crypto, stocks, fx],
  );

  const signals = useMemo(() => {
    const out: Record<string, Signal> = {};
    for (const a of assets) if (KIND_META[a.kind].signal && a.closes.length >= 20) out[a.id] = analyze(a.closes);
    return out;
  }, [assets]);

  const value = useMemo<MarketCtx>(
    () => ({
      assets,
      signals,
      status,
      updatedAt: status.cripto.updatedAt,
      error: status.cripto.error,
      loading: !assets.length && KINDS.every((k) => status[k].state === 'cargando' || status[k].state === 'sin-clave'),
      signalsReady,
      refreshing,
      refresh,
    }),
    [assets, signals, status, signalsReady, refreshing, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}


/** Se vuelve a renderizar cada `ms` para que los tiempos relativos ("hace 2 min") sigan al día. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
