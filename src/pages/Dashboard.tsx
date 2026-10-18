import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Calculator, CircleCheck, Circle, Compass, Sparkles, Store, WifiOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useAlerts } from '../lib/alerts';
import { useMarket } from '../lib/market-context';
import { KIND_META, KINDS, type Asset, type AssetKind } from '../lib/assets';
import { aiEnabled, marketContext, marketSummary } from '../lib/ai';
import { autoSummary } from '../lib/summary';
import { ONBOARDING_STEPS, useOnboarding, type OnboardingStep } from '../lib/onboarding';
import { Callout, Change, EmptyState, AssetMark, PageHeader, Price, Segmented, SectionHead, SignalBadge, Skeleton, Sparkline, renderBold } from '../components/ui';
import type { Signal } from '../lib/indicators';

const SUMMARY_KEY = 'funda:ai-summary';
const SUMMARY_TTL = 30 * 60_000;

const STEPS: { id: OnboardingStep; label: string; to: string }[] = [
  { id: 'asset', label: 'Abre un activo y mira qué dice su señal', to: '/app/mercado/bitcoin' },
  { id: 'tool', label: 'Prueba la calculadora de interés compuesto', to: '/app/herramientas' },
  { id: 'ai', label: 'Pregúntale a Funda IA un término que no entiendas', to: '/app/asistente' },
  { id: 'alert', label: 'Crea tu primera alerta de precio', to: '/app/alertas' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

function FirstSteps({ uid }: { uid: string }) {
  const { done, dismissed, dismiss } = useOnboarding(uid);
  const { alerts } = useAlerts();
  const flags = { ...done, alert: alerts.length > 0 ? (true as const) : undefined };
  const count = ONBOARDING_STEPS.filter((s) => flags[s]).length;
  if (dismissed) return null;
  return (
    <section aria-labelledby="primeros-pasos" className="panel-hard mt-8 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Primeros pasos · {count} de {ONBOARDING_STEPS.length}</p>
          <h2 id="primeros-pasos" className="mt-1 text-2xl">{count === ONBOARDING_STEPS.length ? 'Listo: ya sabes moverte por Funda' : 'Cuatro pasos para entender el mercado antes de invertir'}</h2>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
          Ocultar
        </button>
      </div>
      <div className="mt-4 h-1.5 bg-paper-3" role="presentation">
        <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${(count / ONBOARDING_STEPS.length) * 100}%` }} />
      </div>
      <ol className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {STEPS.map((s) => {
          const ok = !!flags[s.id];
          return (
            <li key={s.id}>
              <Link to={s.to} className="-mx-2 flex min-h-11 items-center gap-3 rounded-[4px] px-2 py-2 text-sm hover:bg-paper-3">
                {ok ? <CircleCheck className="size-5 shrink-0 text-up" aria-hidden /> : <Circle className="size-5 shrink-0 text-ink-3" aria-hidden />}
                <span className={ok ? 'text-ink-2 line-through decoration-ink/30' : 'font-medium text-ink'}>{s.label}</span>
                {ok && <span className="sr-only"> (hecho)</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Row({ a, signal, signalsReady }: { a: Asset; signal?: Signal; signalsReady: boolean }) {
  const hasSignal = KIND_META[a.kind].signal;
  return (
    <li>
      <Link
        to={`/app/mercado/${a.id}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-1 py-3.5 transition-colors hover:bg-paper-2 md:grid-cols-[minmax(0,2.4fr)_1fr_.8fr_.8fr_1.1fr_1.1fr]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <AssetMark asset={a} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{a.name}</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="num text-xs text-ink-2">{a.symbol}</span>
              <span className="md:hidden">{hasSignal && <SignalBadge level={signal?.level} ready={signalsReady} />}</span>
            </span>
          </span>
        </span>
        <span className="text-right">
          <Price value={a.price} asset={a} className="block text-[15px] font-semibold text-ink" />
          <Change value={a.change1d} className="text-xs md:hidden" />
        </span>
        <span className="hidden text-right md:block">
          <Change value={a.change1d} className="text-sm" />
        </span>
        <span className="hidden text-right md:block">
          <Change value={a.change7d} className="text-sm" />
        </span>
        <span className="hidden justify-self-center md:block">
          <Sparkline data={a.spark} className="h-7 w-24" />
        </span>
        <span className="hidden md:flex md:justify-end">
          {hasSignal ? <SignalBadge level={signal?.level} ready={signalsReady} /> : <span className="chip">Sin señal</span>}
        </span>
      </Link>
    </li>
  );
}

function Board({ kind }: { kind: AssetKind | 'todos' }) {
  const { assets, signals, status, signalsReady, refresh } = useMarket();
  const list = kind === 'todos' ? assets : assets.filter((a) => a.kind === kind);
  const kinds = kind === 'todos' ? KINDS : [kind];
  const loading = !list.length && kinds.some((k) => status[k].state === 'cargando');
  const errors = kinds.filter((k) => status[k].state === 'error' && !assets.some((a) => a.kind === k));
  const needsKey = kinds.includes('bolsa') && status.bolsa.state === 'sin-clave';

  return (
    <div>
      <div role="presentation" aria-hidden className="hidden grid-cols-[minmax(0,2.4fr)_1fr_.8fr_.8fr_1.1fr_1.1fr] gap-x-4 border-b border-ink px-1 pb-2 md:grid">
        <span className="kicker">Activo</span>
        <span className="kicker text-right">Precio</span>
        <span className="kicker text-right">Hoy</span>
        <span className="kicker text-right">7 días</span>
        <span className="kicker text-center">Tendencia</span>
        <span className="kicker text-right">Señal</span>
      </div>
      {loading ? (
        <div role="status" className="divide-y divide-line">
          <span className="sr-only">Cargando precios…</span>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <Skeleton className="size-9" />
              <Skeleton className="h-9 flex-1" />
            </div>
          ))}
        </div>
      ) : list.length ? (
        <ul className="divide-y divide-line">
          {list.map((a) => (
            <Row key={a.id} a={a} signal={signals[a.id]} signalsReady={signalsReady} />
          ))}
        </ul>
      ) : null}

      {errors.map((k) => (
        <Callout
          key={k}
          tone="warn"
          icon={WifiOff}
          title={`No pudimos cargar ${KIND_META[k].long.toLowerCase()}`}
          className="mt-4"
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => refresh(true)}>
              Reintentar
            </button>
          }
        >
          {status[k].error}
        </Callout>
      ))}

      {needsKey &&
        (kind === 'bolsa' ? (
          <EmptyState
            icon={Compass}
            title="Los datos de bolsa están desactivados"
            description="En esta versión aún no hay una fuente de datos de bolsa conectada. Mientras tanto puedes aprender qué es un ETF, un bono o el S&P 500."
            action={
              <Link to="/app/aprende" className="btn btn-primary">
                Ir a Aprende
              </Link>
            }
          />
        ) : (
          <Callout tone="info" className="mt-4" title="Bolsa y ETFs: datos desactivados">
            Esta versión aún no tiene una fuente de datos de bolsa conectada. Las divisas y las criptomonedas sí se actualizan solas.
          </Callout>
        ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { assets, signals, status, signalsReady, error, refresh } = useMarket();
  const [tab, setTab] = useState<AssetKind | 'todos'>('todos');
  const [aiText, setAiText] = useState<string | null>(null);
  const u = user!;
  const ready = assets.length > 0 && signalsReady;
  const lines = useMemo(() => autoSummary(assets, signals), [assets, signals]);
  const summaryText = aiText ?? lines.join('\n');
  const allFailed = !assets.length && KINDS.filter((k) => status[k].state !== 'sin-clave').every((k) => status[k].state === 'error');

  // Resumen con Gemini una vez que hay datos y señales; se guarda 30 min para ahorrar cuota
  const asked = useRef(false);
  useEffect(() => {
    if (!ready || !aiEnabled || asked.current) return;
    asked.current = true;
    try {
      const cached = JSON.parse(sessionStorage.getItem(SUMMARY_KEY) ?? 'null');
      if (cached && Date.now() - cached.t < SUMMARY_TTL) return setAiText(cached.text);
    } catch {
      /* sin caché */
    }
    marketSummary(marketContext(assets, signals))
      .then((text) => {
        if (!text) return;
        setAiText(text);
        try {
          sessionStorage.setItem(SUMMARY_KEY, JSON.stringify({ t: Date.now(), text }));
        } catch {
          /* guardar es opcional: el resumen ya se muestra */
        }
      })
      .catch(() => setAiText(null));
  }, [ready, assets, signals]);

  const counts = useMemo(() => {
    const c = { favorable: 0, neutral: 0, precaucion: 0 };
    for (const s of Object.values(signals)) c[s.level]++;
    return c;
  }, [signals]);
  const totalSignals = counts.favorable + counts.neutral + counts.precaucion;

  return (
    <div>
      <title>Mercados · Funda</title>
      <PageHeader
        kicker="Mercados hoy"
        title={
          <>
            {greeting()}, <span className="mark">{u.name.split(' ')[0]}</span>
          </>
        }
        description="Esto es lo que se mueve hoy, explicado para que decidas con calma. Funda lo revisa por ti cada minuto."
      />

      <FirstSteps uid={u.uid} />

      {allFailed ? (
        <div className="mt-8">
          <Callout
            tone="warn"
            icon={WifiOff}
            title="No pudimos cargar los mercados"
            action={
              <button className="btn btn-ghost btn-sm" onClick={() => refresh(true)}>
                Reintentar ahora
              </button>
            }
          >
            {error ?? 'Revisa tu conexión. Volvemos a intentar en un minuto.'}
          </Callout>
        </div>
      ) : (
        <>
          <section className="mt-10" aria-labelledby="resumen">
            <SectionHead id="resumen" n="01" title="Resumen del día" aside={aiText && <span className="chip"><Sparkles className="size-3" aria-hidden /> Con IA</span>} />
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="min-h-28">
                {ready && summaryText ? (
                  <ul key={aiText ? 'ai' : 'auto'} className="animate-swap-in space-y-3 font-display text-[1.2rem] leading-snug text-ink">
                    {summaryText
                      .split('\n')
                      .map((l) => l.replace(/^(?:[•-]|\*(?=\s))\s*/, '').trim())
                      .filter(Boolean)
                      .map((l, i) => (
                        <li key={i} className="flex gap-3">
                          <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 bg-ink" />
                          <span>{renderBold(l)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="space-y-3" role="status">
                    <span className="sr-only">Preparando el resumen…</span>
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                )}
              </div>
              <div className="panel p-5">
                <p className="kicker">Termómetro de señales</p>
                {totalSignals ? (
                  <>
                    <div className="mt-3 flex h-3 overflow-hidden border border-ink" role="img" aria-label={`${counts.favorable} favorables, ${counts.neutral} neutrales, ${counts.precaucion} de precaución`}>
                      <span className="bg-up" style={{ width: `${(counts.favorable / totalSignals) * 100}%` }} />
                      <span className="bg-warn" style={{ width: `${(counts.neutral / totalSignals) * 100}%` }} />
                      <span className="bg-down" style={{ width: `${(counts.precaucion / totalSignals) * 100}%` }} />
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        ['Favorable', counts.favorable, 'text-up'],
                        ['Neutral', counts.neutral, 'text-warn'],
                        ['Precaución', counts.precaucion, 'text-down'],
                      ].map(([label, n, tone]) => (
                        <div key={label as string}>
                          <dd className={`num text-3xl font-semibold ${tone}`}>{n}</dd>
                          <dt className="kicker !text-[10px]">{label}</dt>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <Skeleton className="mt-3 h-20" />
                )}
                <p className="mt-3 text-xs text-ink-2">Cuántos activos tienen cada señal educativa hoy. No es una recomendación.</p>
              </div>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="mercados">
            <SectionHead
              id="mercados"
              n="02"
              title="Los mercados"
              aside={
                <Link to="/app/alertas" className="link inline-flex items-center gap-1">
                  Avísame cuando cambie <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              }
            />
            <Segmented
              label="Tipo de activo"
              value={tab}
              onChange={setTab}
              className="mb-5 w-full sm:w-fit"
              options={[
                { value: 'todos', label: 'Todos' },
                ...KINDS.map((k) => ({ value: k, label: KIND_META[k].label, short: KIND_META[k].label.split(' ')[0] })),
              ]}
            />
            {tab !== 'todos' && <p className="mb-4 max-w-2xl text-sm text-ink-2">{KIND_META[tab].blurb}</p>}
            <Board kind={tab} />
            <p className="mt-4 text-xs text-ink-2">
              «Hoy» es la variación de 24 horas en cripto y la del último cierre en bolsa y divisas. Las divisas se muestran sin señal: dependen de decisiones de los bancos centrales.
            </p>
          </section>
        </>
      )}

      <section className="mt-14" aria-labelledby="herramientas">
        <SectionHead id="herramientas" n="03" title="Para decidir con calma" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Calculator, t: 'Calculadora de interés compuesto', d: 'Mira cuánto crece un ahorro mensual en 10, 20 o 30 años, y cuánto se come la inflación.' },
            { icon: Compass, t: 'Tu perfil de inversionista', d: 'Seis preguntas para ver qué mezcla de ahorro, bolsa y cripto encaja con tu plazo.' },
            { icon: Store, t: 'Dónde invertir', d: 'Exchanges, billeteras y brokers con lo que necesitas saber de cada uno.' },
          ].map(({ icon: Icon, t, d }, i) => (
            <Link key={t} to={i === 2 ? '/app/plataformas' : '/app/herramientas'} className="panel panel-link group p-5">
              <Icon className="size-6 text-ink" aria-hidden />
              <h3 className="mt-3 text-xl">{t}</h3>
              <p className="mt-1.5 text-sm text-ink-2">{d}</p>
              <span className="link mt-3 inline-flex items-center gap-1 text-sm">
                Abrir <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
