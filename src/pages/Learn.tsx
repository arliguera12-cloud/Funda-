import { useDeferredValue, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Lightbulb, Plus, Search, SearchX, Sparkles, X } from 'lucide-react';
import { CATEGORIES, GLOSSARY } from '../data/glossary';
import { GUIDES, GUIDE_GROUPS } from '../data/learn';
import { PROFILES } from '../data/profiles';
import { CATALOG, KIND_META, KINDS } from '../lib/assets';
import { useMarket } from '../lib/market-context';
import { AssetMark, Callout, Change, EmptyState, PageHeader, Price, SectionHead, Segmented } from '../components/ui';

const TABS = [
  { id: 'guias', label: 'Empieza aquí', short: 'Empieza' },
  { id: 'instrumentos', label: 'Instrumentos', short: 'Instrumentos' },
  { id: 'glosario', label: 'Glosario', short: 'Glosario' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ask = (q: string) => `/app/asistente?q=${encodeURIComponent(q)}`;

function Guides() {
  return (
    <div className="space-y-12">
      {GUIDE_GROUPS.map((g) => {
        const items = GUIDES.filter((x) => x.group === g.name);
        return (
          <section key={g.name} aria-labelledby={`g-${g.name}`}>
            <SectionHead id={`g-${g.name}`} title={g.name} aside={<span className="hidden max-w-xs text-right sm:block">{g.blurb}</span>} />
            <div className="divide-y divide-line border-b border-line">
              {items.map((guide, i) => (
                <details key={guide.id} className="group" open={g.name === 'Ruta de inicio' && i === 0}>
                  <summary className="flex min-h-16 cursor-pointer items-center gap-4 py-4">
                    <span className="num text-sm text-ink-3">{g.name === 'Ruta de inicio' ? String(i + 1).padStart(2, '0') : '—'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.4rem] leading-tight font-semibold text-ink">{guide.title}</span>
                      <span className="block text-sm text-ink-2">{guide.summary}</span>
                    </span>
                    <Plus className="size-5 shrink-0 text-ink transition-transform duration-200 group-open:rotate-45" aria-hidden />
                  </summary>
                  <div className="pr-2 pb-6 sm:pl-12">
                    <ol className="space-y-3">
                      {guide.steps.map((s, n) => (
                        <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                          <span className="num mt-0.5 grid size-6 shrink-0 place-items-center border border-ink text-xs font-semibold">{n + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                    <Callout tone="tip" className="mt-5">{guide.tip}</Callout>
                    <Link to={ask(`Tengo una duda sobre: ${guide.title}`)} className="link mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm">
                      <Sparkles className="size-4" aria-hidden /> Pregúntale a Funda IA <span className="sr-only">sobre {guide.title}</span>
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Instruments() {
  const { assets } = useMarket();
  return (
    <div className="space-y-12">
      {KINDS.map((k) => (
        <section key={k} aria-labelledby={`i-${k}`}>
          <SectionHead id={`i-${k}`} title={KIND_META[k].long} aside={<span className="hidden max-w-xs text-right sm:block">{KIND_META[k].blurb}</span>} />
          <div className="grid gap-x-10 md:grid-cols-2">
            {CATALOG.filter((a) => a.kind === k).map((def) => {
              const live = assets.find((a) => a.id === def.id);
              const p = PROFILES[def.id];
              return (
                <article key={def.id} className="border-b border-line py-6">
                  <div className="flex items-center gap-3">
                    <AssetMark asset={live ?? def} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl leading-tight">{def.name} <span className="num text-sm font-normal text-ink-3">{def.symbol}</span></h3>
                      <p className="text-sm font-medium text-ink-2">{def.tagline}</p>
                    </div>
                    {live && (
                      <div className="text-right text-sm">
                        <Price value={live.price} asset={live} className="block font-semibold text-ink" />
                        <Change value={live.change1d} className="text-xs" />
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink">{p.what}</p>
                  <p className="mt-2 text-sm text-ink-2"><strong className="font-semibold text-ink">Riesgo.</strong> {p.risk}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5">
                    <Link to={`/app/mercado/${def.id}`} className="link inline-flex min-h-11 items-center gap-1 text-sm">Ver gráfica y datos <ArrowUpRight className="size-4" aria-hidden /><span className="sr-only"> de {def.name}</span></Link>
                    <Link to={ask(`Explícame ${def.name} como si fuera principiante`)} className="link inline-flex min-h-11 items-center gap-1 text-sm"><Sparkles className="size-4" aria-hidden /> Preguntar a la IA<span className="sr-only"> sobre {def.name}</span></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Glossary() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') ?? '';
  // El texto vive en estado local: atarlo a la URL en cada tecla hace que se pierdan letras al escribir rápido
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const q = useDeferredValue(query);
  const terms = GLOSSARY.filter(
    (t) => (!cat || t.category === cat) && (!q || normalize([t.term, ...(t.aliases ?? []), t.definition].join(' ')).includes(normalize(q))),
  );
  const setCat = (c: string) => {
    const next = new URLSearchParams(params);
    if (c) next.set('cat', c);
    else next.delete('cat');
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-2" aria-hidden />
        <label htmlFor="busca" className="sr-only">Buscar término</label>
        <input id="busca" type="search" className="input pr-11 pl-10" placeholder="Buscar: ETF, inflación, blockchain, staking…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button type="button" className="absolute top-0 right-0 grid size-11 place-items-center text-ink-2 hover:text-ink" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}>
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <div role="group" aria-label="Filtrar por categoría" className="mt-4 flex flex-wrap gap-2">
        {['', ...CATEGORIES].map((c) => (
          <button key={c || 'todos'} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className="chip-btn !py-1.5 pointer-coarse:min-h-10">
            {c || 'Todos'}
          </button>
        ))}
      </div>
      <p role="status" className="sr-only">{terms.length === 1 ? '1 término' : `${terms.length} términos`}{q ? ` para "${q}"` : ''}</p>
      <p aria-hidden className="kicker mt-6">{terms.length} {terms.length === 1 ? 'término' : 'términos'}</p>

      {terms.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={SearchX} title={`Sin resultados para «${q}»`} description="Prueba con otra palabra o pregúntale directamente a Funda IA." action={<Link to={ask(`¿Qué significa ${q}?`)} className="btn btn-primary">Pregúntale a Funda IA</Link>} />
        </div>
      ) : (
        <dl className="mt-2 grid gap-x-12 md:grid-cols-2">
          {terms.map((t) => (
            <div key={t.term} className="border-t border-ink py-5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-display text-[1.6rem] leading-tight font-semibold text-ink">{t.term}</dt>
                <span className="chip shrink-0">{t.category}</span>
              </div>
              <dd className="mt-2 text-[15px] leading-relaxed text-ink">{t.definition}</dd>
              <dd className="mt-3 flex gap-2.5 border-l-[3px] border-mark pl-3 text-sm text-ink-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
                {t.example}
              </dd>
              <dd>
                <Link to={ask(`Explícame más sobre "${t.term}" con un ejemplo`)} className="link mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm">
                  <Sparkles className="size-4" aria-hidden /> Profundizar con IA <span className="sr-only">sobre {t.term}</span>
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'guias') as TabId;

  return (
    <div>
      <title>Aprende · Funda</title>
      <PageHeader
        kicker="Aprende"
        title={<>Todo lo que conviene saber <span className="mark">antes</span> de invertir</>}
        description="Una ruta para empezar desde cero, fichas de cada instrumento y un glosario con ejemplos de la vida diaria."
      />
      <div className="mt-8">
        <Segmented
          mode="tabs"
          label="Secciones de Aprende"
          value={tab}
          onChange={(v) => setParams({ tab: v }, { replace: true })}
          className="w-full sm:w-fit"
          options={TABS.map((t) => ({ value: t.id, label: t.label, short: t.short, id: `tab-${t.id}`, controls: `panel-${t.id}` }))}
        />
      </div>
      <div key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-8 animate-fade-in outline-none">
        {tab === 'guias' && <Guides />}
        {tab === 'instrumentos' && <Instruments />}
        {tab === 'glosario' && <Glossary />}
      </div>
    </div>
  );
}
