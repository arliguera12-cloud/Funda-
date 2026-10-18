import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, Bot, Info } from 'lucide-react';
import { useMarket } from '../lib/market-context';
import { fetchHistory, type PricePoint } from '../lib/market';
import { SIGNAL_META } from '../lib/indicators';
import { compact, pct, usd } from '../lib/format';
import { COIN_PROFILES } from '../data/learn';
import PriceChart from '../components/PriceChart';
import { Change, Disclaimer, SignalBadge, Skeleton } from '../components/ui';

const RANGES = [
  { label: '24 h', days: 1 },
  { label: '7 d', days: 7 },
  { label: '30 d', days: 30 },
  { label: '90 d', days: 90 },
  { label: '1 año', days: 365 },
];

export default function CoinDetail() {
  const { id = '' } = useParams();
  const { coins, signals } = useMarket();
  const coin = coins.find((c) => c.id === id);
  const signal = signals[id];
  const profile = COIN_PROFILES.find((p) => p.id === id);
  const [days, setDays] = useState(7);
  const [history, setHistory] = useState<PricePoint[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setHistory(null);
    setError('');
    fetchHistory(id, days)
      .then((h) => live && setHistory(h))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id, days]);

  if (!coin) {
    return coins.length ? (
      <p className="text-slate-400">
        No encontramos esa moneda. <Link to="/app" className="text-emerald-400 underline">Volver al panel</Link>
      </p>
    ) : (
      <Skeleton className="h-96" />
    );
  }

  const rangeChange = history && history.length > 1 ? (history[history.length - 1][1] / history[0][1] - 1) * 100 : null;
  const question = `Explícame en palabras simples la señal actual de ${coin.name} (${signal ? SIGNAL_META[signal.level].label : 'sin datos'}, RSI ${
    signal?.rsi?.toFixed(0) ?? 'n/d'
  }). ¿Qué debería tener en cuenta un principiante antes de invertir?`;

  const stats: [string, string][] = [
    ['Capitalización de mercado', compact(coin.market_cap)],
    ['Volumen 24 h', compact(coin.total_volume)],
    ['Máximo 24 h', usd(coin.high_24h)],
    ['Mínimo 24 h', usd(coin.low_24h)],
    ['Máximo histórico (ATH)', usd(coin.ath)],
    ['Distancia del ATH', pct(coin.ath_change_percentage)],
    ['Oferta circulante', `${compact(coin.circulating_supply, false)} ${coin.symbol.toUpperCase()}`],
    ['Ranking', `#${coin.market_cap_rank}`],
  ];

  // Score runs from about -4 (caution) to +3 (favorable)
  const meter = signal ? Math.min(100, Math.max(0, ((signal.score + 4) / 7) * 100)) : 50;

  return (
    <div className="space-y-6">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Panel
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={coin.image} alt="" className="h-14 w-14 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{coin.name}</h1>
              <span className="chip">{coin.symbol.toUpperCase()}</span>
            </div>
            <p className="text-sm text-slate-500">{profile?.tagline}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-white tabular-nums sm:text-4xl">{usd(coin.current_price)}</p>
          <Change value={coin.price_change_percentage_24h} /> <span className="text-xs text-slate-500">24 h</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Variación en el periodo: <Change value={rangeChange} />
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist" aria-label="Periodo">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  role="tab"
                  aria-selected={days === r.days}
                  onClick={() => setDays(r.days)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${days === r.days ? 'bg-emerald-400/15 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <div className="grid h-80 place-items-center text-sm text-amber-200">{error}</div>
          ) : history ? (
            <PriceChart data={history} days={days} />
          ) : (
            <Skeleton className="h-80" />
          )}
        </section>

        {/* Signal */}
        <section className="card flex flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Señal educativa</h2>
            <SignalBadge level={signal?.level} long />
          </div>
          <div className="mt-5">
            <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" />
            <div className="relative h-3">
              <span className="absolute -top-3.5 h-5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${meter}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Precaución</span>
              <span>Neutral</span>
              <span>Favorable</span>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            {signal ? (
              signal.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" /> {r}
                </li>
              ))
            ) : (
              <li><Skeleton className="h-24" /></li>
            )}
          </ul>
          <div className="mt-auto grid gap-2 pt-6">
            <Link to={`/app/asistente?q=${encodeURIComponent(question)}`} className="btn btn-primary">
              <Bot className="h-4 w-4" aria-hidden /> Explícamelo con IA
            </Link>
            <Link to={`/app/alertas?coin=${coin.id}`} className="btn btn-ghost">
              <Bell className="h-4 w-4" aria-hidden /> Crear alerta de precio
            </Link>
          </div>
        </section>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-white tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      {/* Profile */}
      {profile && (
        <section className="card grid gap-6 p-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Info className="h-5 w-5 text-emerald-400" aria-hidden /> ¿Qué es {profile.name}?
            </h2>
            <p className="mt-3 leading-relaxed text-slate-300">{profile.what}</p>
            <p className="mt-3 text-slate-400"><strong className="text-slate-200">Para qué se usa:</strong> {profile.useCase}</p>
            <p className="mt-3 text-slate-400"><strong className="text-slate-200">Nivel de riesgo:</strong> {profile.risk}</p>
          </div>
          <dl className="space-y-3 text-sm">
            {profile.facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-white/[0.05] pb-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
