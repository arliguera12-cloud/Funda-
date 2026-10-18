import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellOff, BellRing, CircleCheck, Plus, Trash } from 'lucide-react';
import { useAlerts } from '../lib/alerts';
import { useMarket } from '../lib/market-context';
import { usd } from '../lib/format';
import { Disclaimer } from '../components/ui';

export default function Alerts() {
  const { coins } = useMarket();
  const { alerts, addAlert, removeAlert, signalNotify, setSignalNotify, permission, requestPermission } = useAlerts();
  const [params] = useSearchParams();
  const [coinId, setCoinId] = useState(params.get('coin') ?? 'bitcoin');
  const [price, setPrice] = useState('');
  const coin = coins.find((c) => c.id === coinId);
  const target = Number(price);
  const valid = coin && target > 0 && target !== coin.current_price;
  // Direction is inferred so an alert never fires the instant it is created
  const direction = coin && target > coin.current_price ? 'above' : 'below';

  useEffect(() => {
    if (coin && !price) setPrice(String(Number(coin.current_price.toPrecision(4))));
  }, [coin, price]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    addAlert({ coinId, coinName: coin.name, direction, price: target });
    setPrice('');
  };

  const active = alerts.filter((a) => !a.triggeredAt);
  const done = alerts.filter((a) => a.triggeredAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Alertas automáticas</h1>
        <p className="mt-1 text-slate-400">Funda vigila el mercado cada minuto y te avisa cuando pase algo importante.</p>
      </div>

      {permission !== 'granted' && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-emerald-400/20 p-5">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 h-5 w-5 text-emerald-400" aria-hidden />
            <div>
              <p className="font-semibold text-white">Activa las notificaciones del navegador</p>
              <p className="text-sm text-slate-400">
                {permission === 'denied'
                  ? 'Las bloqueaste antes. Actívalas desde el candado de la barra de direcciones. Mientras tanto verás los avisos dentro de la app.'
                  : permission === 'unsupported'
                    ? 'Tu navegador no admite notificaciones; verás los avisos dentro de la app.'
                    : 'Así te avisamos aunque estés en otra pestaña.'}
              </p>
            </div>
          </div>
          {permission === 'default' && (
            <button className="btn btn-primary" onClick={requestPermission}>
              Activar
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="card space-y-4 p-5 lg:col-span-2">
          <h2 className="font-semibold">Nueva alerta de precio</h2>
          <div>
            <label htmlFor="coin" className="mb-1.5 block text-sm text-slate-300">Criptomoneda</label>
            <select
              id="coin"
              className="input"
              value={coinId}
              onChange={(e) => {
                setCoinId(e.target.value);
                setPrice('');
              }}
            >
              {coins.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface">
                  {c.name} ({c.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm text-slate-300">Precio objetivo (USD)</label>
            <input id="price" type="number" min="0" step="any" inputMode="decimal" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            {coin && (
              <p className="mt-2 text-xs text-slate-500">
                Precio actual: {usd(coin.current_price)}.{' '}
                {valid && (
                  <span className="text-emerald-300">
                    Te avisaremos cuando {direction === 'above' ? 'suba' : 'baje'} a {usd(target)}.
                  </span>
                )}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={!valid}>
            <Plus className="h-4 w-4" aria-hidden /> Crear alerta
          </button>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] p-4">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-400" checked={signalNotify} onChange={(e) => setSignalNotify(e.target.checked)} />
            <span>
              <span className="block text-sm font-semibold text-white">Avisarme cuando cambie una señal</span>
              <span className="text-xs text-slate-400">Por ejemplo, cuando Bitcoin pase de "Neutral" a "Momento favorable".</span>
            </span>
          </label>
        </form>

        <section className="card p-5 lg:col-span-3">
          <h2 className="font-semibold">Alertas activas ({active.length})</h2>
          {active.length === 0 ? (
            <div className="grid place-items-center py-12 text-center text-sm text-slate-500">
              <BellOff className="mb-3 h-8 w-8" aria-hidden />
              Aún no tienes alertas. Crea la primera a la izquierda.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {active.map((a) => {
                const c = coins.find((x) => x.id === a.coinId);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    {c && <img src={c.image} alt="" className="h-8 w-8 rounded-full" />}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {a.coinName} {a.direction === 'above' ? 'sube a' : 'baja a'} {usd(a.price)}
                      </p>
                      <p className="text-xs text-slate-500">Ahora: {usd(c?.current_price)}</p>
                    </div>
                    <button onClick={() => removeAlert(a.id)} className="btn btn-ghost px-3 py-2" aria-label={`Eliminar alerta de ${a.coinName}`}>
                      <Trash className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {done.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-slate-400">Historial</h3>
              <ul className="mt-2 divide-y divide-white/[0.05]">
                {done.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                    <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden />
                    <span className="flex-1 text-slate-300">
                      {a.coinName} {a.direction === 'above' ? 'superó' : 'bajó de'} {usd(a.price)}
                      <span className="block text-xs text-slate-500">{new Date(a.triggeredAt!).toLocaleString('es-419')}</span>
                    </span>
                    <button onClick={() => removeAlert(a.id)} className="text-xs text-slate-500 hover:text-white">
                      Borrar
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-500">Las alertas funcionan mientras Funda esté abierto en alguna pestaña de tu navegador.</p>
      <Disclaimer />
    </div>
  );
}
