import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Search } from 'lucide-react';
import { CATEGORIES, GLOSSARY } from '../data/glossary';
import { COIN_PROFILES, GUIDES } from '../data/learn';
import { useMarket } from '../lib/market-context';
import { usd } from '../lib/format';
import { Change } from '../components/ui';

const TABS = [
  { id: 'monedas', label: 'Criptomonedas' },
  { id: 'glosario', label: 'Glosario' },
  { id: 'guias', label: 'Guías paso a paso' },
] as const;

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'monedas';
  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const { coins } = useMarket();
  const update = (patch: Record<string, string>) => setParams({ ...Object.fromEntries(params), ...patch }, { replace: true });

  const terms = GLOSSARY.filter(
    (t) =>
      (!cat || t.category === cat) &&
      (!q || normalize([t.term, ...(t.aliases ?? []), t.definition].join(' ')).includes(normalize(q))),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Academia</h1>
        <p className="mt-1 text-slate-400">Todo lo que necesitas saber antes de invertir, explicado sin tecnicismos.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${tab === t.id ? 'bg-emerald-400/15 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'monedas' && (
        <div className="grid gap-4 md:grid-cols-2">
          {COIN_PROFILES.map((p) => {
            const live = coins.find((c) => c.id === p.id);
            return (
              <article key={p.id} className="card flex flex-col p-6">
                <div className="flex items-center gap-3">
                  {live && <img src={live.image} alt="" className="h-10 w-10 rounded-full" />}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {p.name} <span className="text-sm font-normal text-slate-500">{p.symbol}</span>
                    </h2>
                    <p className="text-sm text-emerald-300">{p.tagline}</p>
                  </div>
                  {live && (
                    <div className="text-right text-sm">
                      <p className="font-semibold text-white tabular-nums">{usd(live.current_price)}</p>
                      <Change value={live.price_change_percentage_24h} className="text-xs" />
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{p.what}</p>
                <p className="mt-3 text-sm text-slate-400"><strong className="text-slate-200">Uso:</strong> {p.useCase}</p>
                <p className="mt-2 text-sm text-slate-400"><strong className="text-slate-200">Riesgo:</strong> {p.risk}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {live && (
                    <Link to={`/app/cripto/${p.id}`} className="btn btn-ghost py-2 text-xs">Ver gráfica y señal</Link>
                  )}
                  <Link to={`/app/asistente?q=${encodeURIComponent(`Explícame ${p.name} como si fuera principiante`)}`} className="btn btn-ghost py-2 text-xs">
                    <Bot className="h-3.5 w-3.5" aria-hidden /> Preguntar a la IA
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'glosario' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
              <label htmlFor="q" className="sr-only">Buscar término</label>
              <input id="q" className="input pl-11" placeholder="Buscar: blockchain, tokenizar, staking…" value={q} onChange={(e) => update({ q: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['', ...CATEGORIES].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => update({ cat: c })}
                className={`chip px-3 py-1.5 transition ${cat === c ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'hover:text-white'}`}
              >
                {c || 'Todos'}
              </button>
            ))}
          </div>
          {terms.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-400">
              No encontramos "{q}" en el glosario.{' '}
              <Link to={`/app/asistente?q=${encodeURIComponent(`¿Qué significa ${q}?`)}`} className="text-emerald-400 underline">
                Pregúntale a Funda IA
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {terms.map((t) => (
                <article key={t.term} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{t.term}</h2>
                    <span className="chip shrink-0">{t.category}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{t.definition}</p>
                  <p className="mt-3 rounded-xl bg-emerald-400/[0.06] p-3 text-sm text-slate-300">💡 {t.example}</p>
                  <Link
                    to={`/app/asistente?q=${encodeURIComponent(`Explícame más sobre "${t.term}" con un ejemplo`)}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                  >
                    <Bot className="h-3.5 w-3.5" aria-hidden /> Profundizar con IA
                  </Link>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'guias' && (
        <div className="space-y-4">
          {GUIDES.map((g, i) => (
            <details key={g.id} className="card group p-6" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{g.title}</h2>
                  <p className="text-sm text-slate-400">{g.summary}</p>
                </div>
                <span className="text-2xl text-slate-500 transition group-open:rotate-45">+</span>
              </summary>
              <ol className="mt-5 space-y-3">
                {g.steps.map((s, n) => (
                  <li key={s} className="flex gap-3 text-sm text-slate-300">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300">{n + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">✅ {g.tip}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
