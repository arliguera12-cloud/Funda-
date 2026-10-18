import { useEffect, useRef } from 'react';
import { Activity, BellRing, CircleCheck, Info, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone?: 'info' | 'success' | 'alert' | 'signal';
  action?: { label: string; onClick(): void };
  /** Se queda hasta que se cierre (las alertas de precio no deben desaparecer sin verse). */
  persist?: boolean;
  leaving?: boolean;
}

const ICONS = { info: Info, success: CircleCheck, alert: BellRing, signal: Activity };
const BARS = { info: 'bg-ink', success: 'bg-up', alert: 'bg-mark', signal: 'bg-warn' };
const LIFETIME = 6000;

function Toast({ t, onDismiss }: { t: ToastItem; onDismiss(id: number): void }) {
  const timer = useRef<number | undefined>(undefined);
  const Icon = ICONS[t.tone ?? 'info'];

  const start = () => {
    if (t.persist) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Un aviso no debe vencer con la pestaña oculta: nadie lo vería
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
      className="pointer-events-auto relative flex gap-3 rounded-[5px] border border-ink bg-paper py-4 pr-11 pl-5 shadow-[4px_4px_0_0_var(--ink)] transition-[opacity,translate,scale] duration-300 ease-[var(--ease-out)] starting:translate-y-4 starting:opacity-0 data-leaving:translate-y-2 data-leaving:opacity-0 data-leaving:duration-200"
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${BARS[t.tone ?? 'info']}`} />
      <Icon className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden />
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight font-semibold text-ink">{t.title}</p>
        {t.body && <p className="mt-0.5 text-sm text-ink-2">{t.body}</p>}
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
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-[3px] text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
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
      className="pointer-events-none fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex w-[min(calc(100vw-2rem),380px)] flex-col gap-3 lg:bottom-4"
    >
      {toasts.map((t) => (
        <Toast key={t.id} t={t} onDismiss={onDismiss} />
      ))}
    </section>
  );
}
