import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isStale, useMarket } from './market-context';
import { fmtPrice } from './assets';
import { SIGNAL_META, type SignalLevel } from './indicators';
import { store } from './storage';
import Toaster, { type ToastItem } from '../components/Toaster';

export interface PriceAlert {
  id: string;
  assetId: string;
  assetName: string;
  direction: 'above' | 'below';
  price: number;
  createdAt: number;
  triggeredAt?: number;
}

type ToastInput = Omit<ToastItem, 'id' | 'leaving'>;

interface AlertsCtx {
  alerts: PriceAlert[];
  signalNotify: boolean;
  permission: NotificationPermission | 'unsupported';
  addAlert(a: Omit<PriceAlert, 'id' | 'createdAt'>): PriceAlert;
  removeAlert(id: string): void;
  restoreAlert(a: PriceAlert): void;
  setSignalNotify(on: boolean): void;
  requestPermission(): Promise<void>;
  toast(t: ToastInput): number;
}

const Ctx = createContext<AlertsCtx | null>(null);
const icon = `${import.meta.env.BASE_URL}favicon.svg`;

/** Acepta alertas guardadas con el formato anterior (coinId / coinName). */
function normalize(a: unknown): PriceAlert | null {
  const r = a as Record<string, unknown> | null;
  if (!r || typeof r.id !== 'string' || !Number.isFinite(r.price)) return null;
  const assetId = (r.assetId ?? r.coinId) as string | undefined;
  if (typeof assetId !== 'string') return null;
  return { ...(r as unknown as PriceAlert), assetId, assetName: String(r.assetName ?? r.coinName ?? assetId) };
}
const load = (raw: unknown): PriceAlert[] => (Array.isArray(raw) ? raw.flatMap((a) => normalize(a) ?? []) : []);

// shortcut: las alertas se revisan solo con una pestaña abierta y se guardan por navegador; para push real: FCM + Cloud Functions.
export function AlertsProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const { assets, signals, status } = useMarket();
  const keys = { alerts: `funda:alerts:${uid}`, notify: `funda:signal-notify:${uid}`, last: `funda:last-signals:${uid}` };
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => load(store.get<unknown>(keys.alerts, [])));
  const [signalNotify, setSignalNotifyState] = useState<boolean>(() => store.get(keys.notify, true));
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [permission, setPermission] = useState<AlertsCtx['permission']>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const toastId = useRef(0);
  const skipSave = useRef(false);

  // Guardar, y mantenerse sincronizado con otras pestañas (cada una sobrescribiría las alertas de las demás)
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    store.set(keys.alerts, alerts);
  }, [alerts, keys.alerts]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== keys.alerts || !e.newValue) return;
      try {
        skipSave.current = true;
        setAlerts(load(JSON.parse(e.newValue)));
      } catch {
        skipSave.current = false;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [keys.alerts]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 220);
  }, []);

  const toast = useCallback((t: ToastInput) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    return id;
  }, []);

  const notify = (t: ToastInput, tag: string) => {
    toast(t);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        // tag: el sistema muestra una sola notificación aunque varias pestañas la disparen
        new Notification(t.title, { body: t.body, icon, tag });
      } catch {
        /* algunos navegadores móviles solo permiten notificaciones desde un service worker */
      }
    }
  };

  // Alertas de precio (nunca con datos viejos: un precio guardado no debe disparar una alerta)
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const notified = useRef(new Set<string>());
  useEffect(() => {
    const now = Date.now();
    const fired = alertsRef.current.flatMap((a) => {
      const asset = assets.find((x) => x.id === a.assetId);
      if (!asset || a.triggeredAt || notified.current.has(a.id) || isStale(asset.kind, status[asset.kind], now)) return [];
      const hit = a.direction === 'above' ? asset.price >= a.price : asset.price <= a.price;
      return hit ? [{ a, asset }] : [];
    });
    if (!fired.length) return;
    const ids = new Set(fired.map((f) => f.a.id));
    setAlerts((list) => list.map((a) => (ids.has(a.id) && !a.triggeredAt ? { ...a, triggeredAt: now } : a)));
    fired.forEach(({ a, asset }) => {
      notified.current.add(a.id);
      notify(
        {
          tone: 'alert',
          persist: true,
          title: `${a.assetName} ${a.direction === 'above' ? 'superó' : 'bajó de'} ${fmtPrice(asset, a.price)}`,
          body: `Valor actual: ${fmtPrice(asset, asset.price)}`,
        },
        `alert-${a.id}`,
      );
    });
  }, [assets]);

  // Cambios de señal
  useEffect(() => {
    if (!Object.keys(signals).length) return;
    const last = store.get<Record<string, SignalLevel>>(keys.last, {});
    const current = Object.fromEntries(Object.entries(signals).map(([id, s]) => [id, s.level]));
    if (signalNotify) {
      for (const [id, level] of Object.entries(current)) {
        if (last[id] && last[id] !== level && SIGNAL_META[last[id]]) {
          const name = assets.find((c) => c.id === id)?.name ?? id;
          notify({ tone: 'signal', title: `Cambió la señal de ${name}`, body: `${SIGNAL_META[last[id]].short} → ${SIGNAL_META[level].short}` }, `signal-${id}`);
        }
      }
    }
    store.set(keys.last, { ...last, ...current });
  }, [signals]);

  const value: AlertsCtx = {
    alerts,
    signalNotify,
    permission,
    addAlert(a) {
      const alert = { ...a, id: crypto.randomUUID(), createdAt: Date.now() };
      setAlerts((list) => [alert, ...list]);
      return alert;
    },
    removeAlert: (id) => setAlerts((list) => list.filter((a) => a.id !== id)),
    restoreAlert: (a) => setAlerts((list) => (list.some((x) => x.id === a.id) ? list : [a, ...list].sort((x, y) => y.createdAt - x.createdAt))),
    setSignalNotify(on) {
      setSignalNotifyState(on);
      store.set(keys.notify, on);
    },
    async requestPermission() {
      if (typeof Notification === 'undefined') return;
      setPermission(await Notification.requestPermission());
    },
    toast,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
}
