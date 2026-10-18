import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { STALE_MS, useMarket } from './market-context';
import { SIGNAL_META, type SignalLevel } from './indicators';
import { usd } from './format';
import { store } from './storage';
import Toaster, { type ToastItem } from '../components/Toaster';

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
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

const isAlert = (a: unknown): a is PriceAlert =>
  !!a && typeof (a as PriceAlert).id === 'string' && typeof (a as PriceAlert).coinId === 'string' && Number.isFinite((a as PriceAlert).price);

// shortcut: alerts are checked only while a tab is open and stored per browser; move to FCM + Cloud Functions for real push.
export function AlertsProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const { coins, signals, updatedAt } = useMarket();
  const keys = { alerts: `funda:alerts:${uid}`, notify: `funda:signal-notify:${uid}`, last: `funda:last-signals:${uid}` };
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => store.get<unknown[]>(keys.alerts, []).filter(isAlert));
  const [signalNotify, setSignalNotifyState] = useState<boolean>(() => store.get(keys.notify, true));
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [permission, setPermission] = useState<AlertsCtx['permission']>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const toastId = useRef(0);
  const skipSave = useRef(false);

  // Persist, and stay in sync with other open tabs (each tab would otherwise overwrite the others' alerts)
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
        setAlerts((JSON.parse(e.newValue) as unknown[]).filter(isAlert));
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
        // tag: the OS shows one notification even if several tabs fire it
        new Notification(t.title, { body: t.body, icon, tag });
      } catch {
        /* some mobile browsers only allow notifications from a service worker */
      }
    }
  };

  // Price alerts (never on stale data: an old cached price must not trigger an alert)
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const notified = useRef(new Set<string>());
  useEffect(() => {
    if (!coins.length || !updatedAt || Date.now() - updatedAt > STALE_MS) return;
    const priceOf = (id: string) => coins.find((c) => c.id === id)?.current_price;
    const fired = alertsRef.current.filter((a) => {
      const price = priceOf(a.coinId);
      if (a.triggeredAt || price == null || notified.current.has(a.id)) return false;
      return a.direction === 'above' ? price >= a.price : price <= a.price;
    });
    if (!fired.length) return;
    const now = Date.now();
    const ids = new Set(fired.map((a) => a.id));
    setAlerts((list) => list.map((a) => (ids.has(a.id) && !a.triggeredAt ? { ...a, triggeredAt: now } : a)));
    fired.forEach((a) => {
      notified.current.add(a.id);
      notify(
        {
          tone: 'alert',
          persist: true,
          title: `${a.coinName} ${a.direction === 'above' ? 'superó' : 'bajó de'} ${usd(a.price)}`,
          body: `Precio actual: ${usd(priceOf(a.coinId))}`,
        },
        `alert-${a.id}`,
      );
    });
  }, [coins]);

  // Signal changes
  useEffect(() => {
    if (!Object.keys(signals).length) return;
    const last = store.get<Record<string, SignalLevel>>(keys.last, {});
    const current = Object.fromEntries(Object.entries(signals).map(([id, s]) => [id, s.level]));
    if (signalNotify) {
      for (const [id, level] of Object.entries(current)) {
        if (last[id] && last[id] !== level && SIGNAL_META[last[id]]) {
          const name = coins.find((c) => c.id === id)?.name ?? id;
          notify(
            { tone: 'signal', title: `Cambió la señal de ${name}`, body: `${SIGNAL_META[last[id]].short} → ${SIGNAL_META[level].short}` },
            `signal-${id}`,
          );
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
