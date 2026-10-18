import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, CircleCheck, Info, Minus, ShieldCheck, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { SIGNAL_META, type Signal, type SignalLevel } from '../lib/indicators';
import { pct, usd } from '../lib/format';

export const APP_NAME = 'Funda';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg" aria-label={`${APP_NAME}, inicio`}>
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} className="h-8 w-8 rounded-[9px]" />
      <span className="font-display text-[22px] font-bold tracking-[-0.04em] text-white">{APP_NAME}</span>
    </Link>
  );
}

/** 7-day trend line. `area` adds a soft fill, used as a decorative brand device. */
export function Sparkline({ data, className = 'h-12 w-full', area = false }: { data: number[]; className?: string; area?: boolean }) {
  const gid = 'g' + useId().replace(/[^\w-]/g, '');
  if (data.length < 2) return <div className={className} aria-hidden />;
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 28 - 1}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`${up ? 'text-up' : 'text-down'} ${className}`} aria-hidden>
      {area && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,30 ${pts} 100,30`} fill={`url(#${gid})`} />
        </>
      )}
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** A price that briefly flashes green/red when it changes. Color only, so digits never move. */
export function Price({ value, className = '' }: { value?: number | null; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const p = prev.current;
    prev.current = value;
    if (p == null || value == null || p === value) return;
    const up = value > p;
    ref.current?.animate(
      [{ backgroundColor: up ? 'rgb(52 211 153 / 0.2)' : 'rgb(251 113 133 / 0.2)', color: up ? '#6ee7b7' : '#fda4af' }, {}],
      { duration: 1200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  }, [value]);
  return (
    <span ref={ref} className={`num -mx-1 rounded-md px-1 ${className}`}>
      {usd(value)}
    </span>
  );
}

export function Change({ value, className = '' }: { value?: number | null; className?: string }) {
  if (value == null || !Number.isFinite(value)) return <span className={`num text-slate-500 ${className}`}>—</span>;
  const r = Math.round(value * 100) / 100;
  if (r === 0) {
    return (
      <span className={`num inline-flex items-center gap-1 font-medium text-slate-400 ${className}`}>
        <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Sin cambio </span>0.00%
      </span>
    );
  }
  const up = r > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`num inline-flex items-center gap-1 font-medium ${up ? 'text-up' : 'text-down'} ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{up ? 'Sube ' : 'Baja '}</span>
      {pct(r)}
    </span>
  );
}

const TONE_TEXT: Record<SignalLevel, string> = { favorable: 'text-emerald-300', neutral: 'text-amber-300', precaucion: 'text-rose-300' };
const TONE_BAR: Record<SignalLevel, string> = { favorable: 'bg-emerald-400', neutral: 'bg-amber-300', precaucion: 'bg-rose-400' };
const TONE_BOX: Record<SignalLevel, string> = {
  favorable: 'border-emerald-400/30 bg-emerald-400/[0.08]',
  neutral: 'border-amber-300/30 bg-amber-300/[0.08]',
  precaucion: 'border-rose-400/30 bg-rose-400/[0.08]',
};

/** Signal readout: the level is shown by bar count (shape) as well as color. */
export function SignalBadge({ level, long = false, ready = true }: { level?: SignalLevel; long?: boolean; ready?: boolean }) {
  if (!level) {
    return (
      <span className="chip shrink-0 whitespace-nowrap text-slate-400">
        {ready ? 'Sin datos' : <span className="animate-pulse">Analizando…</span>}
      </span>
    );
  }
  const meta = SIGNAL_META[level];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONE_BOX[level]} ${TONE_TEXT[level]}`}
    >
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-[3px] rounded-[1px] ${['h-1.5', 'h-2', 'h-2.5'][i]} ${i < meta.bars ? TONE_BAR[level] : 'bg-white/15'}`} />
        ))}
      </span>
      {long ? meta.label : meta.short}
    </span>
  );
}

/** Horizontal gauge from caution to favorable. Score runs from about -4 to +3. */
export function SignalMeter({ signal }: { signal?: Signal }) {
  const pos = signal ? Math.min(100, Math.max(0, ((signal.score + 4) / 7) * 100)) : 50;
  return (
    <div aria-hidden>
      <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400" />
      <div className="relative h-3">
        <span
          className={`absolute -top-3.5 h-5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_3px_var(--color-surface)] transition-[left] duration-700 ease-[var(--ease-out)] ${signal ? '' : 'opacity-0'}`}
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Precaución</span>
        <span>Neutral</span>
        <span>Favorable</span>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-sm text-slate-400 first-letter:uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function IconTile({ icon: Icon, size = 'md' }: { icon: Icon; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-8 rounded-lg [&>svg]:size-4', md: 'size-11 rounded-xl [&>svg]:size-5', lg: 'size-14 rounded-2xl [&>svg]:size-7' }[size];
  return (
    <span className={`grid shrink-0 place-items-center bg-emerald-400/10 text-emerald-300 ${s}`}>
      <Icon aria-hidden />
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: Icon; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconTile icon={icon} size="lg" />
      <p className="mt-4 font-semibold text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const CALLOUT = {
  info: { box: 'border-white/10 bg-white/[0.03] text-slate-300', icon: Info, iconColor: 'text-slate-400' },
  success: { box: 'border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-100', icon: CircleCheck, iconColor: 'text-emerald-300' },
  warn: { box: 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100', icon: TriangleAlert, iconColor: 'text-amber-300' },
  danger: { box: 'border-rose-400/30 bg-rose-400/10 text-rose-100', icon: CircleAlert, iconColor: 'text-rose-300' },
};

export function Callout({
  tone = 'info',
  icon,
  title,
  children,
  action,
  className = '',
  id,
}: {
  tone?: keyof typeof CALLOUT;
  icon?: Icon;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  const t = CALLOUT[tone];
  const Ico = icon ?? t.icon;
  return (
    <div
      id={id}
      role={tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${t.box} ${className}`}
    >
      <Ico className={`mt-0.5 size-4 shrink-0 ${t.iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-white">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** Coin logo with a lettered fallback when the image is missing or fails to load. */
export function CoinAvatar({ src, symbol, size = 'md' }: { src?: string; symbol: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const s = { sm: 'size-5 text-[8px]', md: 'size-8 text-[11px]', lg: 'size-10 text-xs', xl: 'size-14 text-base' }[size];
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] font-bold text-slate-300 ring-1 ring-white/10 ${s}`}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        symbol.slice(0, 3).toUpperCase()
      )}
    </span>
  );
}

interface SegOption<T extends string | number> {
  value: T;
  label: ReactNode;
  id?: string;
  controls?: string;
}

/**
 * Segmented control with a sliding indicator and arrow-key navigation.
 * mode="radio" for choosing a value (e.g. chart range); mode="tabs" for switching panels.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  mode = 'radio',
  className = '',
  itemClassName = '',
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  mode?: 'radio' | 'tabs';
  className?: string;
  itemClassName?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const ind = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const active = Math.max(0, options.findIndex((o) => o.value === value));

  useLayoutEffect(() => {
    const place = () => {
      const b = refs.current[active];
      const el = ind.current;
      if (!b || !el) return;
      // First placement (and resizes) snap into position; only user changes slide
      if (!placed.current) el.style.transitionDuration = '0ms';
      el.style.transform = `translateX(${b.offsetLeft}px)`;
      el.style.width = `${b.offsetWidth}px`;
      if (!placed.current) {
        el.getBoundingClientRect();
        el.style.transitionDuration = '';
        placed.current = true;
      }
    };
    place();
    let initial = true; // ResizeObserver fires once on observe; ignore it so it can't cut the slide short
    const ro = new ResizeObserver(() => {
      if (initial) return void (initial = false);
      placed.current = false;
      place();
    });
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, [active, options.length]);

  const onKeyDown = (e: KeyboardEvent) => {
    const n = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: options.length - 1 }[e.key];
    if (n == null) return;
    e.preventDefault();
    const i = (n + options.length) % options.length;
    onChange(options[i].value);
    refs.current[i]?.focus();
  };

  const tabs = mode === 'tabs';
  return (
    <div
      ref={root}
      role={tabs ? 'tablist' : 'radiogroup'}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative flex rounded-xl border border-white/10 bg-white/[0.03] p-1 ${className}`}
    >
      <span
        ref={ind}
        aria-hidden
        className="absolute inset-y-1 left-0 rounded-lg bg-emerald-400/15 ring-1 ring-emerald-400/20 transition-[transform,width] duration-[250ms] ease-[var(--ease-out)]"
      />
      {options.map((o, i) => {
        const on = i === active;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={o.id}
            type="button"
            role={tabs ? 'tab' : 'radio'}
            aria-checked={tabs ? undefined : on}
            aria-selected={tabs ? on : undefined}
            aria-controls={o.controls}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors pointer-coarse:min-h-10 ${
              on ? 'text-emerald-200' : 'text-slate-400 hover:text-white'
            } ${itemClassName}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs leading-relaxed text-slate-400 ${className}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {APP_NAME} es una herramienta educativa. Las señales se calculan con indicadores técnicos automáticos y no son asesoría
      financiera. Las criptomonedas son volátiles: invierte solo lo que puedas permitirte perder.
    </p>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

// Minimal **bold** support for AI answers (we ask Gemini to avoid other markdown)
export function renderBold(text: string) {
  // Gemini still emits "* " bullets and *italics* now and then: normalize them before splitting on **bold**
  const clean = text.replace(/^\s*[*-]\s+/gm, '• ').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2');
  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
