import { memo, useEffect, useId, useMemo, useRef } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '../lib/market';
import { fmtPrice, type AssetDef } from '../lib/assets';
import { axisUsd, pct } from '../lib/format';
import { prefersReducedMotion } from './ui';

const TICK = { fill: 'var(--ink-3)', fontSize: 11, fontFamily: '"Geist Mono Variable", ui-monospace, monospace' };

type Unit = Pick<AssetDef, 'unit' | 'symbol'>;

const axisFmt = (u: Unit) => (v: number) => (u.unit === 'usd' ? axisUsd(v) : v.toLocaleString('es-419', { maximumFractionDigits: v >= 100 ? 1 : 3 }));

function PriceChart({ data, days, label, asset }: { data: PricePoint[]; days: number; label: string; asset: Unit }) {
  const pid = 'p' + useId().replace(/[^\w-]/g, '');
  const wrap = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => data.map(([t, p]) => ({ t, p })), [data]);
  const first = data[0]?.[1];
  const last = data[data.length - 1]?.[1];
  const up = data.length > 1 && last >= first;
  const color = up ? 'var(--up)' : 'var(--down)';
  const fmtTime = (t: number) =>
    new Date(t).toLocaleString('es-419', days <= 1 ? { hour: '2-digit', minute: '2-digit' } : days > 100 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });

  // Se revela de izquierda a derecha una vez por montaje (el tiempo fluye así); cambiar de rango no lo repite
  useEffect(() => {
    if (prefersReducedMotion()) return;
    wrap.current?.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: 700,
      easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    });
  }, []);

  return (
    <div ref={wrap} className="h-60 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          title={label}
          desc={data.length > 1 ? `De ${fmtPrice(asset, first)} a ${fmtPrice(asset, last)} (${pct((last / first - 1) * 100)})` : undefined}
        >
          <defs>
            {/* Relleno rayado en diagonal, como los gráficos de periódico */}
            <pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
            </pattern>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={fmtTime} tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--ink)' }} minTickGap={48} />
          <YAxis dataKey="p" domain={['auto', 'auto']} tickFormatter={axisFmt(asset)} tick={TICK} tickLine={false} axisLine={false} width={asset.unit === 'usd' ? 64 : 52} orientation="right" />
          {first != null && <ReferenceLine y={first} stroke="var(--ink-3)" strokeDasharray="2 4" />}
          <Tooltip
            isAnimationActive={false}
            allowEscapeViewBox={{ x: false, y: false }}
            wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
            cursor={{ stroke: 'var(--ink)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label: t }) =>
              active && payload?.length ? (
                <div className="rounded-[4px] border border-ink bg-paper px-3 py-2 shadow-[3px_3px_0_0_var(--ink)]">
                  <p className="kicker !text-[10px]">
                    {new Date(Number(t)).toLocaleString('es-419', { dateStyle: 'medium', timeStyle: days <= 1 ? 'short' : undefined })}
                  </p>
                  <p className="num text-sm font-semibold text-ink">{fmtPrice(asset, Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} fill={`url(#${pid})`} isAnimationActive={false} activeDot={{ r: 4, fill: color, stroke: 'var(--paper)', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Recharts es costoso: evitamos re-renderizar con la actualización de 60 s si la serie no cambió
export default memo(PriceChart);
