import { useEffect, useRef } from 'react';
import { Activity, BellRing, CircleCheck, Info, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone?: 'info' | 'success' | 'alert' | 'signal';
  action?: { label: string; onClick(): void };
  /** Stays until closed (price alerts must not vanish unseen). */
  persist?: boolean;
  leaving?: boolean;
}

const ICONS = { info: Info, success: CircleCheck, alert: BellRing, signal: Activity };
const COLORS = { info: 'text-slate-300', success: 'text-emerald-300', alert: 'text-amber-300', signal: 'text-sky-300' };
const LIFETIME = 6000;

function Toast({ t, onDismiss }: { t: ToastItem; onDismiss(id: number): void }) {
  const timer = useRef<number | undefined>(undefined);
  const Icon = ICONS[t.tone ?? 'info'];

  const start = () => {
    if (t.persist) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Don't let a toast expire while the tab is hidden; it would never be seen
      if (document.hidden) return start();
      onDismiss(t.id);
    }, LIFETIME);
  };
  const stop = () => clearTimeout(timer.current);

  useEffect(() => {
    start();
    return stop;
  }, []);

  return (
    <div
      role={t.tone === 'alert' ? 'alert' : 'status'}
      data-leaving={t.leaving || undefined}
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocus={stop}
      onBlur={start}
      className="glass pointer-events-auto relative flex gap-3 rounded-2xl border border-white/10 p-4 pr-11 shadow-2xl shadow-black/50 transition-[opacity,translate,scale] duration-300 ease-[var(--ease-out)] starting:translate-y-4 starting:scale-[0.98] starting:opacity-0 data-leaving:translate-y-2 data-leaving:opacity-0 data-leaving:duration-200"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${COLORS[t.tone ?? 'info']}`} aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-white">{t.title}</p>
        {t.body && <p className="mt-0.5 text-sm text-slate-400">{t.body}</p>}
        {t.action && (
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3"
            onClick={() => {
              t.action!.onClick();
              onDismiss(t.id);
            }}
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Cerrar aviso"
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export default function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss(id: number): void }) {
  return (
    <section
      aria-label="Avisos"
      className="pointer-events-none fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex w-[min(calc(100vw-2rem),380px)] flex-col gap-2 lg:bottom-4"
    >
      {toasts.map((t) => (
        <Toast key={t.id} t={t} onDismiss={onDismiss} />
      ))}
    </section>
  );
}
