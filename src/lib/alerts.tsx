import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useMarket } from './market-context';
import { SIGNAL_META, type SignalLevel } from './indicators';
import { usd } from './format';

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  direction: 'above' | 'below';
  price: number;
  createdAt: number;
  triggeredAt?: number;
}

interface Toast {
  id: number;
  title: string;
  body: string;
}

interface AlertsCtx {
  alerts: PriceAlert[];
  signalNotify: boolean;
  permission: NotificationPermission | 'unsupported';
  addAlert(a: Omit<PriceAlert, 'id' | 'createdAt'>): void;
  removeAlert(id: string): void;
  setSignalNotify(on: boolean): void;
  requestPermission(): Promise<void>;
}

const Ctx = createContext<AlertsCtx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

// shortcut: alerts are checked only while a tab is open and stored per browser; move to FCM + Cloud Functions for real push.
export function AlertsProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const { coins, signals } = useMarket();
  const keys = { alerts: `funda:alerts:${uid}`, notify: `funda:signal-notify:${uid}`, last: `funda:last-signals:${uid}` };
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => load(keys.alerts, []));
  const [signalNotify, setSignalNotifyState] = useState<boolean>(() => load(keys.notify, true));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [permission, setPermission] = useState<AlertsCtx['permission']>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const toastId = useRef(0);

  useEffect(() => localStorage.setItem(keys.alerts, JSON.stringify(alerts)), [alerts, keys.alerts]);

  const notify = (title: string, body: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.svg' });
      } catch {
        /* some mobile browsers only allow notifications from a service worker */
      }
    }
  };

  // Price alerts
  useEffect(() => {
    if (!coins.length) return;
    const fired: PriceAlert[] = [];
    const next = alerts.map((a) => {
      const price = coins.find((c) => c.id === a.coinId)?.current_price;
      if (a.triggeredAt || price == null) return a;
      const hit = a.direction === 'above' ? price >= a.price : price <= a.price;
      if (!hit) return a;
      const done = { ...a, triggeredAt: Date.now() };
      fired.push(done);
      return done;
    });
    if (!fired.length) return;
    setAlerts(next);
    fired.forEach((a) =>
      notify(
        `🔔 ${a.coinName} ${a.direction === 'above' ? 'superó' : 'bajó de'} ${usd(a.price)}`,
        `Precio actual: ${usd(coins.find((c) => c.id === a.coinId)?.current_price)}`,
      ),
    );
  }, [coins]);

  // Signal changes
  useEffect(() => {
    if (!Object.keys(signals).length) return;
    const last = load<Record<string, SignalLevel>>(keys.last, {});
    const current = Object.fromEntries(Object.entries(signals).map(([id, s]) => [id, s.level]));
    if (signalNotify) {
      for (const [id, level] of Object.entries(current)) {
        if (last[id] && last[id] !== level) {
          const name = coins.find((c) => c.id === id)?.name ?? id;
          notify(`📊 Cambió la señal de ${name}`, `${SIGNAL_META[last[id]].short} → ${SIGNAL_META[level].label}`);
        }
      }
    }
    localStorage.setItem(keys.last, JSON.stringify({ ...last, ...current }));
  }, [signals]);

  const value: AlertsCtx = {
    alerts,
    signalNotify,
    permission,
    addAlert: (a) => setAlerts((list) => [{ ...a, id: crypto.randomUUID(), createdAt: Date.now() }, ...list]),
    removeAlert: (id) => setAlerts((list) => list.filter((a) => a.id !== id)),
    setSignalNotify(on) {
      setSignalNotifyState(on);
      localStorage.setItem(keys.notify, JSON.stringify(on));
    },
    async requestPermission() {
      if (typeof Notification === 'undefined') return;
      setPermission(await Notification.requestPermission());
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-20 z-50 flex w-[min(92vw,360px)] flex-col gap-2 lg:bottom-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="card pointer-events-auto animate-[fadeUp_.3s_ease-out] border-emerald-400/30 p-4 shadow-2xl shadow-black/50">
            <p className="font-semibold text-white">{t.title}</p>
            <p className="mt-1 text-sm text-slate-400">{t.body}</p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
}
