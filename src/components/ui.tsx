import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info, Lightbulb, TriangleAlert, CircleAlert, CircleCheck } from 'lucide-react';
import { fmtPrice, type Asset, type AssetDef } from '../lib/assets';
import { SIGNAL_META, type Signal, type SignalLevel } from '../lib/indicators';
import { pct } from '../lib/format';

export const APP_NAME = 'Trace YN';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Logotipo: la palabra en serif y un cuadradito de marcador. */
export function Logo({ to = '/', size = 'md' }: { to?: string; size?: 'md' | 'lg' }) {
  return (
    <Link to={to} className="inline-flex items-baseline gap-0.5 rounded-sm" aria-label={`${APP_NAME}, inicio`}>
      <span className={`font-display font-semibold tracking-[-0.04em] text-ink ${size === 'lg' ? 'text-4xl' : 'text-[28px]'} leading-none`}>{APP_NAME}</span>
      <span aria-hidden className={`inline-block bg-mark ${size === 'lg' ? 'size-2.5' : 'size-2'}`} />
    </Link>
  );
}

/** Mini-gráfica de tendencia. `area` agrega un relleno rayado, como en los gráficos de periódico. */
export function Sparkline({ data, className = 'h-10 w-full', area = false }: { data: number[]; className?: string; area?: boolean }) {
  const pid = 'h' + useId().replace(/[^\w-]/g, '');
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
            <pattern id={pid} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.45" />
            </pattern>
          </defs>
          <polygon points={`0,30 ${pts} 100,30`} fill={`url(#${pid})`} />
        </>
      )}
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Precio que destella en verde o rojo cuando cambia. Solo cambia de color: los dígitos no se mueven. */
export function Price({ value, asset, className = '' }: { value?: number | null; asset?: Pick<AssetDef, 'unit' | 'symbol'>; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const p = prev.current;
    prev.current = value;
    if (p == null || value == null || p === value) return;
    const tone = value > p ? 'var(--up)' : 'var(--down)';
    ref.current?.animate([{ backgroundColor: `color-mix(in srgb, ${tone} 28%, transparent)` }, { backgroundColor: 'transparent' }], {
      duration: 1200,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    });
  }, [value]);
  return (
    <span ref={ref} className={`num -mx-1 rounded-[3px] px-1 ${className}`}>
      {fmtPrice(asset ?? { unit: 'usd', symbol: 'USD' }, value)}
    </span>
  );
}

/** Variación con triángulo (▲ ▼) al estilo de las tablas de bolsa. */
export function Change({ value, className = '', inverse = false }: { value?: number | null; className?: string; inverse?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <span className={`num text-ink-3 ${className}`}>—</span>;
  const r = Math.round(value * 100) / 100;
  if (r === 0) {
    return (
      <span className={`num inline-flex items-center gap-1 font-medium text-ink-2 ${className}`}>
        <span aria-hidden>■</span>
        <span className="sr-only">Sin cambio </span>0.00%
      </span>
    );
  }
  const up = r > 0;
  return (
    <span className={`num inline-flex items-center gap-1 font-medium ${up ? (inverse ? 'text-up-inv' : 'text-up') : inverse ? 'text-down-inv' : 'text-down'} ${className}`}>
      <span aria-hidden className="text-[0.7em]">{up ? '▲' : '▼'}</span>
      <span className="sr-only">{up ? 'Sube ' : 'Baja '}</span>
      {pct(r).replace(/^[+-]/, '')}
    </span>
  );
}

const TONE_TEXT: Record<SignalLevel, string> = { favorable: 'text-up', neutral: 'text-warn', precaucion: 'text-down' };
const TONE_BAR: Record<SignalLevel, string> = { favorable: 'bg-up', neutral: 'bg-warn', precaucion: 'bg-down' };
const TONE_BORDER: Record<SignalLevel, string> = { favorable: 'border-up', neutral: 'border-warn', precaucion: 'border-down' };

/** Sello de señal: el nivel se ve por la cantidad de barras (forma) y por el color. */
export function SignalBadge({ level, long = false, ready = true }: { level?: SignalLevel; long?: boolean; ready?: boolean }) {
  if (!level) {
    return (
      <span className="chip shrink-0 whitespace-nowrap">
        {ready ? 'Sin señal' : <span className="animate-pulse">Analizando…</span>}
      </span>
    );
  }
  const meta = SIGNAL_META[level];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-[3px] border px-2 py-[3px] font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase ${TONE_BORDER[level]} ${TONE_TEXT[level]}`}
    >
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-[3px] ${['h-1.5', 'h-2', 'h-2.5'][i]} ${i < meta.bars ? TONE_BAR[level] : 'bg-ink/20'}`} />
        ))}
      </span>
      {long ? meta.label : meta.short}
    </span>
  );
}

/** Termómetro: una regla con marcas y un puntero. La puntuación va de aproximadamente -4 a +3. */
export function SignalMeter({ signal }: { signal?: Signal }) {
  const pos = signal ? Math.min(100, Math.max(0, ((signal.score + 4) / 7) * 100)) : 50;
  const ticks = 29;
  return (
    <div aria-hidden>
      <div className="relative pt-3">
        <span
          className={`absolute top-0 -translate-x-1/2 text-[10px] leading-none text-ink transition-[left] duration-700 ease-[var(--ease-out)] ${signal ? '' : 'opacity-0'}`}
          style={{ left: `${pos}%` }}
        >
          ▼
        </span>
        <div className="flex h-5 items-end justify-between border-b border-ink">
          {Array.from({ length: ticks }, (_, i) => (
            <span key={i} className={`w-px bg-ink ${i % 7 === 0 ? 'h-5' : i % 7 === 3 || i % 7 === 4 ? 'h-3' : 'h-2'}`} />
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] tracking-[0.06em] text-ink-2 uppercase">
        <span className="text-down">Precaución</span>
        <span className="text-warn">Neutral</span>
        <span className="text-up">Favorable</span>
      </div>
    </div>
  );
}

/** Cabecera de página: etiqueta, titular grande en serif, bajada y filete doble. */
export function PageHeader({ kicker, title, description, actions }: { kicker?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="rule-double flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-5 pb-6">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.02]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Encabezado de sección numerado, con filete superior. */
export function SectionHead({ n, title, aside, id }: { n?: string; title: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 pt-3 pb-4">
      <h2 id={id} tabIndex={id ? -1 : undefined} className="text-2xl leading-tight outline-none sm:text-[1.7rem]">
        {n && <span className="kicker mr-3 align-middle">{n}</span>}
        {title}
      </h2>
      {aside && <div className="shrink-0 text-sm text-ink-2">{aside}</div>}
    </div>
  );
}

export function IconTile({ icon: Icon, size = 'md' }: { icon: Icon; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-8 [&>svg]:size-4', md: 'size-11 [&>svg]:size-5', lg: 'size-14 [&>svg]:size-7' }[size];
  return (
    <span className={`grid shrink-0 place-items-center rounded-[4px] border border-ink bg-mark text-[#17140f] ${s}`}>
      <Icon aria-hidden />
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: Icon; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[5px] border border-dashed border-ink/40 px-6 py-12 text-center">
      <IconTile icon={icon} size="lg" />
      <p className="mt-4 font-display text-xl font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const CALLOUT = {
  info: { bar: 'bg-ink', icon: Info, iconColor: 'text-ink-2' },
  tip: { bar: 'bg-mark', icon: Lightbulb, iconColor: 'text-ink' },
  success: { bar: 'bg-up', icon: CircleCheck, iconColor: 'text-up' },
  warn: { bar: 'bg-warn', icon: TriangleAlert, iconColor: 'text-warn' },
  danger: { bar: 'bg-down', icon: CircleAlert, iconColor: 'text-down' },
};

/** Nota con barra lateral de color, como un recuadro de periódico. */
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
      className={`relative flex items-start gap-3 rounded-[4px] border border-line bg-paper-2 py-3.5 pr-4 pl-5 text-sm leading-relaxed text-ink-2 ${className}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />
      <Ico className={`mt-0.5 size-4 shrink-0 ${t.iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** Marca de un activo: logo de la moneda, o un monograma tipográfico para el resto. */
export function AssetMark({ asset, size = 'md' }: { asset: Pick<Asset, 'symbol' | 'kind'> & { image?: string }; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const s = { sm: 'size-6 text-[9px]', md: 'size-9 text-[11px]', lg: 'size-11 text-xs', xl: 'size-16 text-base' }[size];
  const logo = asset.image && !failed;
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[4px] border border-ink/70 bg-paper font-mono font-semibold text-ink ${s}`}>
      {logo ? (
        <img
          // El logo "large" de CoinGecko pesa ~250 px; "small" alcanza para íconos de hasta 36 px
          src={size === 'sm' || size === 'md' ? asset.image!.replace('/large/', '/small/') : asset.image}
          alt=""
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        asset.symbol.slice(0, 3)
      )}
    </span>
  );
}

interface SegOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Etiqueta corta para pantallas angostas. */
  short?: ReactNode;
  id?: string;
  controls?: string;
}

/**
 * Control segmentado con indicador que se desliza y navegación con flechas.
 * mode="radio" para elegir un valor (p. ej. el rango de la gráfica); mode="tabs" para cambiar de panel.
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
  const wrap = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const active = Math.max(0, options.findIndex((o) => o.value === value));

  // El indicador mide la opción activa (ancho y posición exactos); se desliza solo cuando cambia la selección y salta a su sitio al cargar, al cambiar el tamaño o al llegar las tipografías
  const place = (snap: boolean) => {
    const b = refs.current[active];
    const el = ind.current;
    if (!b || !el) return;
    el.style.transitionDuration = snap ? '0ms' : '';
    el.style.transform = `translateX(${b.offsetLeft}px)`;
    el.style.width = `${b.offsetWidth}px`;
    // Si las opciones no caben, el contenedor se desplaza (sin mover la página): la activa siempre queda a la vista
    const w = wrap.current;
    if (w) {
      const right = b.offsetLeft + b.offsetWidth;
      if (b.offsetLeft < w.scrollLeft) w.scrollLeft = b.offsetLeft - 2;
      else if (right > w.scrollLeft + w.clientWidth) w.scrollLeft = right - w.clientWidth + 2;
    }
  };
  useLayoutEffect(() => {
    place(!placed.current);
    placed.current = true;
  }, [active, options.length]); // eslint-disable-line
  useEffect(() => {
    const snap = () => place(true);
    window.addEventListener('resize', snap);
    document.fonts?.ready.then(snap);
    return () => window.removeEventListener('resize', snap);
  }, [active]); // eslint-disable-line

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
      ref={wrap}
      role={tabs ? 'tablist' : 'radiogroup'}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative flex w-fit max-w-full overflow-x-auto rounded-[5px] border border-ink bg-paper p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <span ref={ind} aria-hidden className="absolute inset-y-0.5 left-0 rounded-[3px] bg-ink transition-[transform,width] duration-[250ms] ease-[var(--ease-out)]" />
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
            className={`relative z-10 flex-none rounded-[3px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors pointer-coarse:min-h-10 focus-visible:outline-offset-[-2px] sm:px-4 sm:text-xs ${
              on ? 'text-on-ink' : 'text-ink-2 hover:text-ink'
            } ${itemClassName}`}
          >
            {o.short ? (
              <>
                <span className="sm:hidden">{o.short}</span>
                <span className="hidden sm:inline">{o.label}</span>
              </>
            ) : (
              o.label
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-2 ${className}`}>
      <strong className="font-semibold text-ink">Aviso.</strong> {APP_NAME} es una herramienta educativa. Las señales se calculan con indicadores técnicos automáticos y no son
      asesoría financiera ni una recomendación de compra o venta. Todas las inversiones pueden perder valor; invierte solo lo que puedas permitirte perder.
    </p>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[3px] bg-paper-3 ${className}`} />;
}

// **negritas** mínimas para las respuestas de la IA (le pedimos que evite otro markdown)
export function renderBold(text: string) {
  // Gemini aún emite viñetas "* " y *cursivas* de vez en cuando: las normalizamos antes de separar **negritas**
  const clean = text.replace(/^\s*[*-]\s+/gm, '• ').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2');
  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
