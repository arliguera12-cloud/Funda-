import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { PROFILES, QUESTIONS, compound, scoreProfile, simulateDca, type RiskProfile } from '../lib/calc';
import { KIND_META, fmtPrice } from '../lib/assets';
import { pct, usd } from '../lib/format';
import { useMarket } from '../lib/market-context';
import { Callout, PageHeader, Segmented, Skeleton } from '../components/ui';

const TABS = [
  { value: 'interes', label: 'Interés compuesto', short: 'Interés' },
  { value: 'dca', label: 'Compras periódicas', short: 'Compras' },
  { value: 'perfil', label: 'Tu perfil', short: 'Perfil' },
] as const;
type Tab = (typeof TABS)[number]['value'];

const money = (n: number) => usd(Math.round(n)).replace(/\.00$/, '');

/** Número editable que no se pelea con quien escribe (texto libre, se valida al calcular). */
function NumberField({ label, value, onChange, prefix, suffix, hint }: { label: string; value: string; onChange(v: string): void; prefix?: string; suffix?: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        {prefix && <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2">{prefix}</span>}
        <input id={id} className={`input num ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ink-2">{suffix}</span>}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

const num = (s: string) => Number(s.replace(/[,\s$%]/g, ''));

function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange(v: number): void; format(v: number): string }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label !mb-0">{label}</label>
        <output htmlFor={id} className="num text-sm font-semibold text-ink">{format(value)}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 h-8 w-full cursor-pointer accent-[var(--ink)]" />
    </div>
  );
}

function Compound() {
  const [initial, setInitial] = useState('500');
  const [monthly, setMonthly] = useState('50');
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [infl, setInfl] = useState(3);
  const i0 = Math.max(0, num(initial) || 0);
  const m0 = Math.max(0, num(monthly) || 0);
  const rows = useMemo(() => compound({ initial: i0, monthly: m0, ratePct: rate, years, inflationPct: infl }), [i0, m0, rate, years, infl]);
  const last = rows[rows.length - 1];
  const interest = last.balance - last.contributed;
  const crossover = rows.find((r) => r.year > 0 && r.balance - r.contributed > r.contributed)?.year;
  const max = Math.max(...rows.map((r) => r.balance), 1);
  const W = 100 / rows.length;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
      <form className="panel-hard space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-2xl">Tus números</h2>
        <NumberField label="Ahorro inicial" value={initial} onChange={setInitial} prefix="$" />
        <NumberField label="Aporte cada mes" value={monthly} onChange={setMonthly} prefix="$" />
        <Slider label="Rendimiento anual esperado" value={rate} min={0} max={15} step={0.5} onChange={setRate} format={(v) => `${v}%`} />
        <Slider label="Años" value={years} min={1} max={40} onChange={setYears} format={(v) => `${v} años`} />
        <Slider label="Inflación anual esperada" value={infl} min={0} max={10} step={0.5} onChange={setInfl} format={(v) => `${v}%`} />
        <p className="text-xs text-ink-2">El rendimiento es un supuesto para jugar con los números, no una promesa. Una cuenta de ahorro rinde menos que la bolsa, y la bolsa sube y baja.</p>
      </form>

      <div>
        <p className="kicker">Dentro de {years} años tendrías</p>
        <p className="num mt-1 text-[clamp(2.4rem,7vw,4rem)] leading-none font-semibold" aria-live="polite">{money(last.balance)}</p>
        <dl className="mt-5 grid grid-cols-3 gap-px border border-line bg-line text-sm">
          <div className="bg-paper p-3"><dt className="kicker !text-[10px]">Pusiste</dt><dd className="num mt-1 font-semibold">{money(last.contributed)}</dd></div>
          <div className="bg-paper p-3"><dt className="kicker !text-[10px]">Ganó el interés</dt><dd className="num mt-1 font-semibold text-up">{money(interest)}</dd></div>
          <div className="bg-paper p-3"><dt className="kicker !text-[10px]">En dinero de hoy</dt><dd className="num mt-1 font-semibold">{money(last.real)}</dd></div>
        </dl>

        <figure className="mt-6">
          <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="h-52 w-full border-b border-ink" role="img" aria-label={`Crecimiento año por año hasta ${money(last.balance)}: ${money(last.contributed)} aportados y ${money(interest)} de interés`}>
            {rows.slice(1).map((r, i) => {
              const hC = (r.contributed / max) * 50;
              const hI = ((r.balance - r.contributed) / max) * 50;
              return (
                <g key={r.year}>
                  <rect x={(i + 1) * W + W * 0.1} y={51 - hC} width={W * 0.8} height={hC} className="fill-ink" />
                  <rect x={(i + 1) * W + W * 0.1} y={51 - hC - hI} width={W * 0.8} height={hI} className="fill-mark" stroke="var(--ink)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>
          <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2.5 bg-ink" /> Lo que aportas</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2.5 border border-ink bg-mark" /> Lo que gana el interés</span>
          </figcaption>
        </figure>

        <div className="mt-5 space-y-3">
          {crossover != null && (
            <Callout tone="tip">A partir del año <strong className="text-ink">{crossover}</strong> el interés ya aporta más que tú. Esa es la fuerza del tiempo: por eso empezar temprano pesa más que aportar mucho.</Callout>
          )}
          {infl > 0 && (
            <Callout tone="info">Con {infl} % de inflación, {money(last.balance)} dentro de {years} años compran lo que hoy compran {money(last.real)}. Un buen plan busca rendir por encima de la inflación.</Callout>
          )}
        </div>
      </div>
    </div>
  );
}

function Dca() {
  const { assets, signalsReady } = useMarket();
  const options = assets.filter((a) => a.closes.length >= 30 && a.kind !== 'divisa');
  const [pick, setPick] = useState('bitcoin');
  const [amount, setAmount] = useState('25');
  const [every, setEvery] = useState(7);
  const asset = options.find((a) => a.id === pick) ?? options[0];

  const result = useMemo(() => {
    if (!asset) return null;
    // Los cierres de bolsa son días hábiles (5 por semana); los de cripto, todos los días
    const step = asset.kind === 'cripto' ? every : Math.max(1, Math.round((every * 5) / 7));
    return simulateDca(asset.closes, Math.max(0, num(amount) || 0), step);
  }, [asset, amount, every]);

  if (!asset) {
    return signalsReady ? (
      <Callout tone="warn" title="Aún no hay historial para simular">Necesitamos cargar precios de los últimos meses. Vuelve a intentarlo en un momento.</Callout>
    ) : (
      <Skeleton className="h-64" />
    );
  }
  const better = result && result.dca.returnPct > result.lump.returnPct;
  const closes = asset.closes;
  const min = Math.min(...closes);
  const range = Math.max(...closes) - min || 1;
  const step = asset.kind === 'cripto' ? every : Math.max(1, Math.round((every * 5) / 7));
  const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * 100},${48 - ((c - min) / range) * 44}`).join(' ');

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
      <form className="panel-hard space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-2xl">Compras periódicas</h2>
        <p className="text-sm text-ink-2">¿Qué habría pasado si, en lugar de invertir todo de golpe, hubieras comprado un poco cada cierto tiempo? Lo probamos con los precios reales de los últimos ~90 días.</p>
        <div>
          <label htmlFor="dca-activo" className="label">Activo</label>
          <select id="dca-activo" className="input" value={asset.id} onChange={(e) => setPick(e.target.value)}>
            {options.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.symbol}) · {KIND_META[a.kind].label}</option>)}
          </select>
        </div>
        <NumberField label="Cuánto compras cada vez" value={amount} onChange={setAmount} prefix="$" />
        <div>
          <p className="label" id="dca-freq">Cada cuánto</p>
          <Segmented label="Frecuencia de compra" value={every} onChange={setEvery} options={[{ value: 7, label: 'Semanal' }, { value: 14, label: 'Quincenal' }, { value: 30, label: 'Mensual' }]} />
        </div>
      </form>

      <div>
        {result ? (
          <>
            <p className="kicker">Invertiste en total</p>
            <p className="num mt-1 text-[clamp(2.2rem,6vw,3.5rem)] leading-none font-semibold">{money(result.invested)}</p>
            <p className="mt-1 text-sm text-ink-2">en {result.buys} compras de {money(num(amount))}</p>

            <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2">
              {[
                { t: 'Comprando de a poco', r: result.dca, win: better },
                { t: 'Todo el primer día', r: result.lump, win: !better },
              ].map(({ t, r, win }) => (
                <div key={t} className={`p-4 ${win ? 'bg-mark text-[#17140f]' : 'bg-paper'}`}>
                  <p className="kicker !text-inherit">{t}</p>
                  <p className="num mt-1 text-2xl font-semibold">{money(r.value)}</p>
                  <p className={`num text-sm font-semibold ${win ? '' : r.returnPct >= 0 ? 'text-up' : 'text-down'}`}>{r.returnPct >= 0 ? '+' : ''}{r.returnPct.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            <figure className="mt-6">
              <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="h-40 w-full border-b border-ink" role="img" aria-label={`Precio de ${asset.name} en los últimos 90 días con ${result.buys} compras marcadas`}>
                <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                {closes.map((c, i) => i % step === 0 && <line key={i} x1={(i / (closes.length - 1)) * 100} x2={(i / (closes.length - 1)) * 100} y1={48 - ((c - min) / range) * 44} y2="51" stroke="var(--ink-3)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeDasharray="1 1.5" />)}
              </svg>
              <figcaption className="mt-2 text-xs text-ink-2">Las líneas punteadas marcan cada compra. Precio: {fmtPrice(asset, closes[0])} → {fmtPrice(asset, closes[closes.length - 1])} ({pct((closes[closes.length - 1] / closes[0] - 1) * 100)}).</figcaption>
            </figure>

            <Callout tone="tip" className="mt-5" title="Lo que esto enseña">
              {better ? 'En este periodo, comprar de a poco rindió más que invertir todo el primer día, porque el precio bajó en algún tramo.' : 'En este periodo, invertir todo el primer día rindió más, porque el precio subió casi todo el tiempo.'} No siempre pasa lo mismo: el DCA no gana siempre, pero evita el riesgo de elegir justo el peor día para entrar.
            </Callout>
          </>
        ) : (
          <Callout tone="warn">Escribe un monto mayor que 0 para ver la simulación.</Callout>
        )}
      </div>
    </div>
  );
}

function Profile() {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const complete = answers.every((a) => a != null);
  const result: RiskProfile | null = complete ? scoreProfile(answers as number[]) : null;
  const p = result ? PROFILES[result] : null;
  const tones = ['bg-ink', 'bg-ink-2', 'bg-mark', 'bg-up'];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <form className="space-y-7" onSubmit={(e) => e.preventDefault()}>
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q.q} className="border-t border-ink pt-3">
            <legend className="font-display text-xl font-semibold text-ink"><span className="kicker mr-3 align-middle">{String(qi + 1).padStart(2, '0')}</span>{q.q}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o) => {
                const on = answers[qi] === o.points;
                return (
                  <label key={o.label} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[4px] border px-3.5 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${on ? 'border-ink bg-ink text-on-ink' : 'border-ink/40 bg-paper hover:bg-paper-3'}`}>
                    <input type="radio" name={`q${qi}`} className="sr-only" checked={on} onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? o.points : x)))} />
                    <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded-full border ${on ? 'border-on-ink' : 'border-ink'}`}>{on && <span className="size-2 rounded-full bg-mark" />}</span>
                    {o.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </form>

      <aside className="self-start lg:sticky lg:top-20" aria-live="polite">
        {p && result ? (
          <div className="panel-hard animate-swap-in p-5 sm:p-6">
            <p className="kicker">Tu perfil de ejemplo</p>
            <h2 className="mt-1 text-4xl"><span className="mark">{p.name}</span></h2>
            <p className="mt-3 text-ink-2">{p.summary}</p>
            <div className="mt-5 flex h-4 overflow-hidden border border-ink" role="img" aria-label={`Mezcla de ejemplo: ${p.mix.map((m) => `${m.label} ${m.pct}%`).join(', ')}`}>
              {p.mix.map((m, i) => m.pct > 0 && <span key={m.label} className={tones[i]} style={{ width: `${m.pct}%` }} />)}
            </div>
            <ul className="mt-3 space-y-1.5">
              {p.mix.map((m, i) => (
                <li key={m.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2"><span aria-hidden className={`size-2.5 border border-ink ${tones[i]}`} />{m.label}</span>
                  <span className="num font-semibold">{m.pct}%</span>
                </li>
              ))}
            </ul>
            <Callout tone="warn" className="mt-5">Es un ejemplo educativo para entender cómo se reparte el riesgo, no una recomendación personal. Tu situación real puede pedir otra mezcla.</Callout>
            <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => setAnswers(QUESTIONS.map(() => null))}>
              <RotateCcw className="size-4" aria-hidden /> Empezar de nuevo
            </button>
          </div>
        ) : (
          <div className="rounded-[5px] border border-dashed border-ink/40 p-6">
            <p className="kicker">Tu resultado</p>
            <p className="mt-2 font-display text-2xl font-semibold">Responde las {QUESTIONS.length} preguntas</p>
            <p className="mt-1 text-sm text-ink-2">{answers.filter((a) => a != null).length} de {QUESTIONS.length} respondidas. No hay respuestas buenas ni malas: solo importa que sean sinceras.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Tools() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === params.get('herramienta'))?.value ?? 'interes') as Tab;

  return (
    <div>
      <title>Herramientas · Trace YN</title>
      <PageHeader
        kicker="Herramientas"
        title={<>Haz las cuentas <span className="mark">antes</span> de invertir</>}
        description="Tres herramientas para entender el tiempo, la constancia y tu propio estómago frente al riesgo. Sirven para cualquier inversión, no solo para cripto."
      />
      <div className="mt-8">
        <Segmented
          mode="tabs"
          label="Herramientas"
          value={tab}
          onChange={(v) => setParams({ herramienta: v }, { replace: true })}
          options={TABS.map((t) => ({ value: t.value, label: t.label, short: t.short, id: `tab-${t.value}`, controls: `panel-${t.value}` }))}
        />
      </div>
      <div key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-8 animate-fade-in outline-none">
        {tab === 'interes' && <Compound />}
        {tab === 'dca' && <Dca />}
        {tab === 'perfil' && <Profile />}
      </div>
    </div>
  );
}
