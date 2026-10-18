import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { SIGNAL_META, type SignalLevel } from '../lib/indicators';
import { pct } from '../lib/format';

export const APP_NAME = 'Funda';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label={`${APP_NAME}, inicio`}>
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span className="font-display text-xl font-bold text-white">{APP_NAME}</span>
    </Link>
  );
}

export function Sparkline({ data, className = 'h-12 w-full' }: { data: number[]; className?: string }) {
  if (data.length < 2) return <div className={className} />;
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 28 - 1}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const TONES: Record<SignalLevel, string> = {
  favorable: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  neutral: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  precaucion: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

export function SignalBadge({ level, long = false }: { level?: SignalLevel; long?: boolean }) {
  if (!level) return <span className="chip text-slate-500">Analizando…</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[level]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {long ? SIGNAL_META[level].label : SIGNAL_META[level].short}
    </span>
  );
}

export function Change({ value, className = '' }: { value?: number | null; className?: string }) {
  if (value == null) return <span className={`text-slate-500 ${className}`}>—</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'} ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {pct(value)}
    </span>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs leading-relaxed text-slate-500 ${className}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {APP_NAME} es una herramienta educativa. Las señales se calculan con indicadores técnicos automáticos y no son asesoría
      financiera. Las criptomonedas son volátiles: invierte solo lo que puedas permitirte perder.
    </p>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

// Minimal **bold** support for AI answers (we ask Gemini to avoid other markdown)
export function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong> : part,
  );
}
