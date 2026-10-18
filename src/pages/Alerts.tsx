import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellOff, BellRing, Check, ChevronDown, CircleCheck, Info, Plus, Trash2 } from 'lucide-react';
import { useAlerts } from '../lib/alerts';
import { KIND_META, defOf, fmtPrice } from '../lib/assets';
import { pct } from '../lib/format';
import { useMarket } from '../lib/market-context';
import { prefersReducedMotion, AssetMark, Callout, EmptyState, PageHeader, Price, SectionHead, Skeleton } from '../components/ui';

const CHIPS = [-10, -5, 5, 10];

function Switch({ on, onChange, label, id }: { on: boolean; onChange(v: boolean): void; label: string; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 shrink-0 rounded-[4px] border border-ink bg-paper transition-colors aria-checked:bg-ink pointer-coarse:my-2"
    >
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-[2px] border border-ink bg-mark transition-transform duration-200 ease-[var(--ease-out)] ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function Alerts() {
  const { assets, signalsReady } = useMarket();
  const { alerts, addAlert, removeAlert, restoreAlert, signalNotify, setSignalNotify, permission, requestPermission, toast } = useAlerts();
  const [params] = useSearchParams();
  const [picked, setPicked] = useState<string | null>(params.get('activo'));
  const [price, setPrice] = useState<string | null>(null); // null = el usuario aún no lo tocó
  const [justCreated, setJustCreated] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(Date.now());

  const asset = assets.find((a) => a.id === picked) ?? assets.find((a) => a.id === 'bitcoin') ?? assets[0];
  const suggested = asset ? String(Number((asset.price * 1.05).toPrecision(4))) : '';
  const shown = price ?? suggested;
  const target = Number(shown.replace(/[,\s$]/g, ''));
  const valid = !!asset && Number.isFinite(target) && target > 0 && target !== asset.price;
  const direction = asset && target > asset.price ? 'above' : 'below';
  const dist = asset && valid ? (target / asset.price - 1) * 100 : null;
  const hint = !asset
    ? ''
    : !shown
      ? 'Escribe el precio al que quieres que te avisemos.'
      : !Number.isFinite(target) || target <= 0
        ? 'Escribe un precio mayor que 0.'
        : target === asset.price
          ? 'Elige un precio distinto al actual: así sabemos si avisarte al subir o al bajar.'
          : `Te avisaremos cuando ${direction === 'above' ? 'suba' : 'baje'} a ${fmtPrice(asset, target)} (${pct(dist)} desde ahora).`;

  useEffect(() => {
    if (!justCreated) return;
    const t = setTimeout(() => setJustCreated(false), 1800);
    return () => clearTimeout(t);
  }, [justCreated]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!asset || !valid) return;
    const dirWord = direction === 'above' ? 'suba' : 'baje';
    addAlert({ assetId: asset.id, assetName: asset.name, direction, price: target });
    toast({ tone: 'success', title: 'Alerta creada', body: `Te avisaremos cuando ${asset.name} ${dirWord} a ${fmtPrice(asset, target)}.` });
    setPrice(null);
    setJustCreated(true);
    priceRef.current?.focus();
    if (matchMedia('(max-width: 1023px)').matches) document.getElementById('alertas-activas')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const active = alerts.filter((a) => !a.triggeredAt);
  const done = alerts.filter((a) => a.triggeredAt);
  const focusList = () => requestAnimationFrame(() => listRef.current?.focus());

  return (
    <div>
      <title>Alertas · Trace YN</title>
      <PageHeader
        kicker="Alertas"
        title={
          <>
            Que el mercado te <span className="mark">avise</span> a ti
          </>
        }
        description="Elige un precio y te avisamos cuando el activo llegue a él. Revisamos el mercado cada minuto mientras tengas Trace YN abierto."
      />

      {alerts.length > 0 && permission === 'default' && (
        <Callout
          tone="info"
          icon={BellRing}
          title="¿Te avisamos aunque estés en otra pestaña?"
          className="mt-6"
          action={
            <button className="btn btn-ghost btn-sm" onClick={requestPermission}>
              Activar avisos
            </button>
          }
        >
          Activa las notificaciones del navegador para no perderte tus alertas.
        </Callout>
      )}
      {alerts.length > 0 && permission === 'denied' && (
        <Callout tone="warn" className="mt-6">
          Bloqueaste las notificaciones del navegador. Actívalas desde el candado de la barra de direcciones; mientras tanto verás los avisos dentro de la app.
        </Callout>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-8">
          <form onSubmit={submit} className="panel-hard space-y-5 p-5 sm:p-6" noValidate>
            <h2 className="text-2xl">Nueva alerta de precio</h2>
            {!asset ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <div>
                  <label htmlFor="activo" className="label">Activo</label>
                  <div className="relative">
                    <select
                      id="activo"
                      className="input appearance-none pr-10"
                      value={asset.id}
                      onChange={(e) => {
                        setPicked(e.target.value);
                        setPrice(null);
                      }}
                    >
                      {(['cripto', 'bolsa', 'divisa'] as const).map((k) => {
                        const group = assets.filter((a) => a.kind === k);
                        return group.length ? (
                          <optgroup key={k} label={KIND_META[k].long}>
                            {group.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.symbol})
                              </option>
                            ))}
                          </optgroup>
                        ) : null;
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-2" aria-hidden />
                  </div>
                </div>
                <div>
                  <label htmlFor="precio" className="label">
                    {asset.unit === 'usd' ? 'Precio objetivo (USD)' : `Valor objetivo (${asset.symbol} por 1 USD)`}
                  </label>
                  <div className="relative">
                    {asset.unit === 'usd' && <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2">$</span>}
                    <input
                      ref={priceRef}
                      id="precio"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className={`input num ${asset.unit === 'usd' ? 'pl-8' : ''}`}
                      value={shown}
                      onChange={(e) => setPrice(e.target.value)}
                      aria-invalid={!valid && shown !== '' ? true : undefined}
                      aria-describedby="precio-ayuda"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Atajos de porcentaje">
                    {CHIPS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="chip-btn num !px-2.5 !py-1 text-xs pointer-coarse:min-h-10"
                        onClick={() => setPrice(String(Number((asset.price * (1 + p / 100)).toPrecision(4))))}
                      >
                        {p > 0 ? '+' : ''}
                        {p}%
                      </button>
                    ))}
                  </div>
                  <p id="precio-ayuda" aria-live="polite" className={`mt-3 text-sm ${valid ? 'text-ink' : 'text-warn'}`}>
                    <span className="text-ink-2">
                      Ahora: <Price value={asset.price} asset={asset} />.{' '}
                    </span>
                    {hint}
                  </p>
                </div>
                <button type="submit" className="btn btn-primary w-full" aria-disabled={!valid || undefined}>
                  <span key={String(justCreated)} className="animate-swap-in inline-flex items-center gap-2">
                    {justCreated ? (
                      <>
                        <Check className="size-4" aria-hidden /> Alerta creada
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" aria-hidden /> Crear alerta
                      </>
                    )}
                  </span>
                </button>
                <p className="flex items-start gap-2 text-xs text-ink-2">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Las alertas se revisan solo mientras Trace YN está abierto en tu navegador.
                </p>
              </>
            )}
          </form>

          <section className="panel p-5" aria-labelledby="avisos-senal">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="avisos-senal" className="text-xl">Avisos de señal</h2>
                <p className="mt-1 text-sm text-ink-2">Te avisamos cuando la señal de un activo cambie, por ejemplo de «Neutral» a «Favorable».</p>
              </div>
              <Switch id="switch-senal" on={signalNotify} onChange={setSignalNotify} label="Avisarme cuando cambie una señal" />
            </div>
            {!signalsReady && <p className="mt-2 text-xs text-ink-2">Calculando señales…</p>}
          </section>
        </div>

        <section aria-labelledby="alertas-activas">
          <SectionHead id="alertas-activas" title={`Alertas activas (${active.length})`} />
          <h3 ref={listRef} tabIndex={-1} className="sr-only outline-none">Lista de alertas</h3>
          {active.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Aún no tienes alertas"
              description="Crea la primera con el formulario: por ejemplo, que te avisemos si Bitcoin baja un 10 %."
            />
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {active.map((a) => {
                const live = assets.find((x) => x.id === a.assetId);
                const def = defOf(a.assetId);
                const away = live ? (a.price / live.price - 1) * 100 : null;
                const closeness = away == null ? 0 : Math.max(0, Math.min(1, 1 - Math.abs(away) / 10));
                return (
                  <li key={a.id} className={`flex items-center gap-3 py-4 ${a.createdAt > mounted.current ? 'animate-fade-up' : ''}`}>
                    <AssetMark asset={live ?? def ?? { symbol: a.assetName, kind: 'cripto' }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        {a.assetName} {a.direction === 'above' ? 'sube a' : 'baja a'} <span className="num">{def ? fmtPrice(def, a.price) : a.price}</span>
                      </p>
                      <p className="text-xs text-ink-2">
                        Ahora: {live ? <Price value={live.price} asset={live} /> : '—'}
                        {away != null && <> · Faltan <span className="num">{Math.abs(away).toFixed(1)}%</span></>}
                      </p>
                      <div className="mt-2 h-1 bg-paper-3" aria-hidden>
                        <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${closeness * 100}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        removeAlert(a.id);
                        toast({ title: 'Alerta eliminada', body: a.assetName, action: { label: 'Deshacer', onClick: () => restoreAlert(a) } });
                        focusList();
                      }}
                      className="btn btn-ghost btn-sm btn-icon pointer-coarse:size-11"
                      aria-label={`Eliminar alerta de ${a.assetName} a ${def ? fmtPrice(def, a.price) : a.price}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {done.length > 0 && (
            <>
              <h3 className="kicker mt-8">Historial</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {done.map((a) => {
                  const def = defOf(a.assetId);
                  const text = `${a.assetName} ${a.direction === 'above' ? 'superó' : 'bajó de'} ${def ? fmtPrice(def, a.price) : a.price}`;
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                      <CircleCheck className="size-4 shrink-0 text-up" aria-hidden />
                      <span className="flex-1 text-ink-2">
                        <span className="num">{text}</span>
                        <span className="block text-xs">{new Date(a.triggeredAt!).toLocaleString('es-419')}</span>
                      </span>
                      <button
                        onClick={() => {
                          removeAlert(a.id);
                          focusList();
                        }}
                        className="btn btn-ghost btn-sm btn-icon pointer-coarse:size-11"
                        aria-label={`Borrar del historial: ${text}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
