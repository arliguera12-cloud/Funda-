import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, Compass, SearchX, Sparkles, WifiOff } from 'lucide-react';
import { KIND_META, defOf, fmtPrice } from '../lib/assets';
import { fetchAssetHistory } from '../lib/history';
import { SIGNAL_META } from '../lib/indicators';
import { useMarket } from '../lib/market-context';
import type { PricePoint } from '../lib/market';
import { stocksEnabled } from '../lib/stocks';
import { PROFILES } from '../data/profiles';
import { Callout, Change, EmptyState, AssetMark, Price, Segmented, SectionHead, SignalBadge, SignalMeter, Skeleton } from '../components/ui';

const PriceChart = lazy(() => import('../components/PriceChart'));

interface Series {
  id: string;
  days: number;
  data: PricePoint[];
}

export default function AssetDetail() {
  const { id = '' } = useParams();
  const def = defOf(id);
  const { assets, signals, status, signalsReady, refresh } = useMarket();
  const asset = assets.find((a) => a.id === id);
  const signal = signals[id];
  const meta = def ? KIND_META[def.kind] : null;
  const [days, setDays] = useState(meta?.defaultRange ?? 7);
  const [series, setSeries] = useState<Series | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const kindStatus = def ? status[def.kind] : null;
  const canFetch = !!def && (def.kind !== 'bolsa' || stocksEnabled);

  // Al cambiar de activo se reinicia el rango y la serie
  useEffect(() => {
    if (!meta) return;
    setDays(meta.defaultRange);
    setSeries(null);
    setError('');
  }, [id]); // eslint-disable-line

  useEffect(() => {
    if (!def || !canFetch) return;
    let live = true;
    let retry: number | undefined;
    setError('');
    fetchAssetHistory(def, days)
      .then((data) => {
        if (!live) return;
        if (data.length < 2) throw new Error('No hay suficientes datos para este periodo.');
        setSeries({ id: def.id, days, data });
      })
      .catch((e: Error) => {
        if (!live) return;
        setError(e.message);
        retry = window.setTimeout(() => setAttempt((n) => n + 1), 30_000); // reintento automático
      });
    return () => {
      live = false;
      clearTimeout(retry);
    };
  }, [def, days, attempt, canFetch]);

  if (!def || !meta) {
    return (
      <div className="py-6">
        <title>Activo no encontrado · Trace YN</title>
        <EmptyState
          icon={SearchX}
          title="No encontramos ese activo"
          description="Revisa el enlace o vuelve al panel para ver los mercados disponibles."
          action={
            <Link to="/app" className="btn btn-primary">
              Volver a Mercados
            </Link>
          }
        />
      </div>
    );
  }

  const profile = PROFILES[def.id];
  const stale = series && series.days !== days;
  const range = series && series.data.length > 1 ? (series.data[series.data.length - 1][1] / series.data[0][1] - 1) * 100 : null;
  const rangeLabel = meta.ranges.find((r) => r.days === days)?.label ?? '';
  const question = `Explícame ${def.name} (${def.symbol}) como si fuera principiante: qué es, qué mueve su precio y qué debo tener en cuenta antes de invertir.${
    signal ? ` Hoy su señal educativa es "${SIGNAL_META[signal.level].label}" (RSI ${signal.rsi?.toFixed(0) ?? 'n/d'}).` : ''
  }`;
  const noKey = def.kind === 'bolsa' && kindStatus?.state === 'sin-clave';
  const meter = signal ? SIGNAL_META[signal.level] : null;

  return (
    <div>
      <title>{`${def.name} ${asset ? fmtPrice(def, asset.price) : ''} · Trace YN`}</title>
      <Link to="/app" className="-ml-1 inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Mercados
      </Link>

      <header className="rule-double flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pt-5 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <AssetMark asset={asset ?? def} size="xl" />
          <div className="min-w-0">
            <p className="kicker mb-1.5">
              {meta.long} · <span className="num normal-case">{def.symbol}</span>
            </p>
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.02]">{def.name}</h1>
            <p className="mt-1 text-ink-2">{def.tagline}</p>
          </div>
        </div>
        {asset && (
          <div className="text-right">
            <p className="text-3xl font-semibold sm:text-4xl">
              <Price value={asset.price} asset={asset} />
            </p>
            <p className="mt-1 flex items-center justify-end gap-2 text-sm">
              <Change value={asset.change1d} />
              <span className="text-ink-2">{meta.changeLabel === '24 h' ? 'en 24 h' : 'último día'}</span>
            </p>
            {asset.asOf && <p className="mt-0.5 text-xs text-ink-2">Dato del {new Date(`${asset.asOf}T12:00:00Z`).toLocaleDateString('es-419', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</p>}
          </div>
        )}
      </header>

      {noKey && (
        <Callout tone="info" icon={Compass} title="Los datos de bolsa están desactivados" className="mt-6">
          Todavía no hay una fuente de datos de bolsa conectada, así que aquí solo verás la ficha educativa de {def.name}.
        </Callout>
      )}
      {!asset && !noKey && kindStatus?.state === 'error' && (
        <Callout
          tone="warn"
          icon={WifiOff}
          title="No pudimos cargar este activo"
          className="mt-6"
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => refresh(true)}>
              Reintentar
            </button>
          }
        >
          {kindStatus.error}
        </Callout>
      )}

      {canFetch && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.9fr_1fr]">
          <section aria-labelledby="grafica" aria-busy={!series && !error}>
            <div className="rule flex flex-wrap items-center justify-between gap-3 pt-3 pb-4">
              <h2 id="grafica" className="text-xl">
                Evolución del precio
                <span aria-live="polite" className="ml-3 align-middle text-sm font-normal text-ink-2">
                  {range != null && !stale && (
                    <>
                      en {rangeLabel.toLowerCase()}: <Change value={range} />
                    </>
                  )}
                </span>
              </h2>
              <Segmented label="Periodo de la gráfica" value={days} onChange={setDays} options={meta.ranges.map((r) => ({ value: r.days, label: r.label }))} />
            </div>
            {error && !series ? (
              <Callout
                tone="warn"
                icon={WifiOff}
                title="No pudimos cargar la gráfica"
                action={
                  <button className="btn btn-ghost btn-sm" onClick={() => setAttempt((n) => n + 1)}>
                    Reintentar
                  </button>
                }
              >
                {error} Reintentaremos en unos segundos.
              </Callout>
            ) : series && series.id === def.id ? (
              <div className={`transition-opacity duration-200 ${stale ? 'opacity-40' : ''}`} aria-busy={!!stale}>
                <Suspense fallback={<Skeleton className="h-60 sm:h-80" />}>
                  <PriceChart data={series.data} days={series.days} label={`Precio de ${def.name}, ${rangeLabel}`} asset={def} />
                </Suspense>
              </div>
            ) : (
              <Skeleton className="h-60 sm:h-80" />
            )}
            {error && series && <p role="alert" className="mt-2 text-xs text-warn">{error}</p>}
          </section>

          <aside aria-labelledby="senal" className="panel-hard self-start p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="senal" className="text-xl">
                {meta.signal ? 'Señal educativa' : 'Sobre la señal'}
              </h2>
              {meta.signal && <SignalBadge level={signal?.level} long ready={signalsReady} />}
            </div>
            {meta.signal ? (
              <>
                <div className="mt-6">
                  <SignalMeter signal={signal} />
                </div>
                {meter && <p className="mt-4 text-sm font-medium text-ink">{meter.hint}</p>}
                <ul className="mt-3 space-y-2.5 text-sm text-ink-2">
                  {signal ? (
                    signal.reasons.map((r) => (
                      <li key={r} className="flex gap-2.5">
                        <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-ink" /> {r}
                      </li>
                    ))
                  ) : (
                    <li>
                      <Skeleton className="h-20" />
                    </li>
                  )}
                </ul>
                <p className="mt-4 text-xs text-ink-2">Indicadores educativos sobre el pasado: no son una recomendación de compra o venta.</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-2">
                En las divisas no calculamos una señal: el tipo de cambio depende sobre todo de las decisiones de los bancos centrales y de la economía de cada país, no de patrones de precio. Úsalo para entender cuánto vale tu dólar en otra moneda.
              </p>
            )}
            <div className="mt-5 grid gap-2">
              <Link to={`/app/asistente?q=${encodeURIComponent(question)}`} className="btn btn-primary">
                <Sparkles className="size-4" aria-hidden /> Explícamelo con IA
              </Link>
              {asset && (
                <Link to={`/app/alertas?activo=${def.id}`} className="btn btn-ghost">
                  <Bell className="size-4" aria-hidden /> Crear alerta de precio
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {asset && (
        <section className="mt-10" aria-labelledby="datos">
          <SectionHead id="datos" title="Los datos" />
          <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {asset.stats.map(([label, value]) => (
              <div key={label} className="bg-paper p-4">
                <dt className="kicker !text-[10px]">{label}</dt>
                <dd className="num mt-1.5 text-[15px] font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {profile && (
        <section className="mt-10" aria-labelledby="ficha">
          <SectionHead id="ficha" title={`¿Qué es ${def.name}?`} aside={<Link to="/app/aprende?tab=instrumentos" className="link">Ver todos los instrumentos</Link>} />
          <div className="grid gap-8 md:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4 text-[17px] leading-relaxed text-ink-2">
              <p className="font-display text-[1.3rem] leading-snug text-ink">{profile.what}</p>
              <p>
                <strong className="font-semibold text-ink">Para qué sirve.</strong> {profile.useCase}
              </p>
              <p>
                <strong className="font-semibold text-ink">Nivel de riesgo.</strong> {profile.risk}
              </p>
            </div>
            <dl className="self-start text-sm">
              {profile.facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
