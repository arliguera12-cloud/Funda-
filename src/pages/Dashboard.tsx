import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bell, BookOpen, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useMarket } from '../lib/market-context';
import { aiEnabled, marketContext, marketSummary } from '../lib/ai';
import { SIGNAL_META, type Signal } from '../lib/indicators';
import type { Coin } from '../lib/market';
import { compact, pct, usd } from '../lib/format';
import { Change, SignalBadge, Skeleton, Sparkline, renderBold } from '../components/ui';

const SUMMARY_KEY = 'funda:ai-summary';
const SUMMARY_TTL = 30 * 60_000;

function autoSummary(coins: Coin[], signals: Record<string, Signal>): string {
  const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const up = coins.filter((c) => (c.price_change_percentage_24h ?? 0) > 0).length;
  const fav = coins.filter((c) => signals[c.id]?.level === 'favorable').map((c) => c.name);
  const caution = coins.filter((c) => signals[c.id]?.level === 'precaucion').map((c) => c.name);
  return [
    `• ${up} de ${coins.length} criptos suben en las últimas 24 h. Mejor: ${best.name} (${pct(best.price_change_percentage_24h)}); peor: ${worst.name} (${pct(worst.price_change_percentage_24h)}).`,
    fav.length ? `• Señal favorable en: ${fav.join(', ')}.` : '• Ninguna moneda muestra hoy una señal claramente favorable.',
    caution.length ? `• Precaución en: ${caution.join(', ')} (posible sobrecompra o tendencia bajista).` : '• No hay señales de precaución fuertes.',
  ].join('\n');
}

export default function Dashboard() {
  const { user } = useAuth();
  const { coins, signals, loading, error } = useMarket();
  const [summary, setSummary] = useState<string | null>(null);
  const ready = coins.length > 0 && Object.keys(signals).length === coins.length;

  // Auto-generate the AI summary once signals are ready; cached 30 min to save quota
  useEffect(() => {
    if (!ready || !aiEnabled) return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(SUMMARY_KEY) ?? 'null');
      if (cached && Date.now() - cached.t < SUMMARY_TTL) return setSummary(cached.text);
    } catch {
      /* ignore */
    }
    marketSummary(marketContext(coins, signals))
      .then((text) => {
        if (!text) return;
        setSummary(text);
        sessionStorage.setItem(SUMMARY_KEY, JSON.stringify({ t: Date.now(), text }));
      })
      .catch(() => setSummary(null));
  }, [ready]);

  const firstName = user!.name.split(' ')[0];
  const today = new Date().toLocaleDateString('es-419', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500 first-letter:uppercase">{today}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-slate-400">Así está el mercado ahora mismo. Funda lo revisa por ti cada minuto.</p>
      </div>

      {error && !coins.length && (
        <div className="card border-amber-400/30 p-5 text-sm text-amber-200">{error} Reintentaremos automáticamente.</div>
      )}

      {/* Summary */}
      <section className="card relative overflow-hidden p-6">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4" aria-hidden /> Resumen del mercado {summary ? '· Gemini' : '· automático'}
          </div>
          {ready ? (
            <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-300">{renderBold(summary ?? autoSummary(coins, signals))}</p>
          ) : (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
        </div>
      </section>

      {/* Coin cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Las 5 criptomonedas más importantes</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-44" />)
            : coins.map((c) => (
                <Link key={c.id} to={`/app/cripto/${c.id}`} className="card group p-5 transition hover:border-emerald-400/30">
                  <div className="flex items-center gap-3">
                    <img src={c.image} alt="" className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.symbol.toUpperCase()} · #{c.market_cap_rank}</p>
                    </div>
                    <SignalBadge level={signals[c.id]?.level} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-bold text-white tabular-nums">{usd(c.current_price)}</p>
                      <Change value={c.price_change_percentage_24h} className="text-sm" />
                      <span className="ml-1 text-xs text-slate-500">24 h</span>
                    </div>
                    <Sparkline data={c.sparkline_in_7d?.price ?? []} className="h-12 w-28" />
                  </div>
                </Link>
              ))}
          {!loading && (
            <div className="card flex flex-col justify-between gap-3 p-5">
              <p className="font-semibold text-white">Accesos rápidos</p>
              <Link to="/app/alertas" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white">
                <Bell className="h-4 w-4 text-emerald-400" aria-hidden /> Crear una alerta de precio
              </Link>
              <Link to="/app/asistente" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white">
                <Bot className="h-4 w-4 text-emerald-400" aria-hidden /> Preguntar a Funda IA
              </Link>
              <Link to="/app/aprende" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white">
                <BookOpen className="h-4 w-4 text-emerald-400" aria-hidden /> Aprender términos clave
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats table */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-semibold">Estadísticas y señales</h2>
          <Link to="/app/aprende?tab=glosario&q=RSI" className="text-xs text-emerald-400 hover:underline">
            ¿Qué significan?
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-y border-white/[0.06] bg-white/[0.02] text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Moneda</th>
                <th className="px-5 py-3 text-right font-medium">Precio</th>
                <th className="px-5 py-3 text-right font-medium">1 h</th>
                <th className="px-5 py-3 text-right font-medium">7 d</th>
                <th className="px-5 py-3 text-right font-medium">Cap. mercado</th>
                <th className="px-5 py-3 text-right font-medium">RSI</th>
                <th className="px-5 py-3 font-medium">Tendencia</th>
                <th className="px-5 py-3 font-medium">Señal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {coins.map((c) => {
                const s = signals[c.id];
                const trend = s?.smaShort != null && s.smaLong != null ? (s.smaShort > s.smaLong ? 'Alcista' : 'Bajista') : '—';
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link to={`/app/cripto/${c.id}`} className="flex items-center gap-2 font-medium text-white hover:underline">
                        <img src={c.image} alt="" className="h-5 w-5 rounded-full" /> {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right text-white tabular-nums">{usd(c.current_price)}</td>
                    <td className="px-5 py-3 text-right"><Change value={c.price_change_percentage_1h_in_currency} /></td>
                    <td className="px-5 py-3 text-right"><Change value={c.price_change_percentage_7d_in_currency} /></td>
                    <td className="px-5 py-3 text-right text-slate-300 tabular-nums">{compact(c.market_cap)}</td>
                    <td className="px-5 py-3 text-right text-slate-300 tabular-nums">{s?.rsi?.toFixed(0) ?? '—'}</td>
                    <td className={`px-5 py-3 ${trend === 'Alcista' ? 'text-emerald-400' : trend === 'Bajista' ? 'text-rose-400' : 'text-slate-500'}`}>{trend}</td>
                    <td className="px-5 py-3" title={s ? SIGNAL_META[s.level].label : undefined}>
                      <SignalBadge level={s?.level} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Link to="/app/alertas" className="flex items-center justify-center gap-1 border-t border-white/[0.06] p-4 text-sm text-emerald-400 hover:bg-white/[0.02]">
          Recibir aviso cuando cambie una señal <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

    </div>
  );
}
