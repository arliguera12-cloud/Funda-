import { memo, useEffect, useId, useMemo, useRef } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '../lib/market';
import { axisUsd, pct, usd } from '../lib/format';
import { prefersReducedMotion } from './ui';

const UP = '#34d399';
const DOWN = '#fb7185';
const TICK = { fill: '#8190a6', fontSize: 11, fontFamily: '"Geist Mono Variable", ui-monospace, monospace' };

function PriceChart({ data, days, label }: { data: PricePoint[]; days: number; label: string }) {
  const gid = 'g' + useId().replace(/[^\w-]/g, '');
  const wrap = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => data.map(([t, p]) => ({ t, p })), [data]);
  const first = data[0]?.[1];
  const last = data[data.length - 1]?.[1];
  const up = data.length > 1 && last >= first;
  const color = up ? UP : DOWN;
  const fmtTime = (t: number) =>
    new Date(t).toLocaleString('es-419', days <= 1 ? { hour: '2-digit', minute: '2-digit' } : days > 90 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });

  // Reveal left-to-right once per mount (time flows left to right); range switches don't replay it
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
          desc={data.length > 1 ? `De ${usd(first)} a ${usd(last)} (${pct((last / first - 1) * 100)})` : undefined}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={fmtTime} tick={TICK} tickLine={false} axisLine={false} minTickGap={48} />
          <YAxis dataKey="p" domain={['auto', 'auto']} tickFormatter={axisUsd} tick={TICK} tickLine={false} axisLine={false} width={64} orientation="right" />
          {first != null && <ReferenceLine y={first} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 4" />}
          <Tooltip
            isAnimationActive={false}
            allowEscapeViewBox={{ x: false, y: false }}
            wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
            cursor={{ stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label: t }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-white/10 bg-raised/95 px-3 py-2 shadow-xl shadow-black/40">
                  <p className="text-xs text-slate-400">
                    {new Date(Number(t)).toLocaleString('es-419', { dateStyle: 'medium', timeStyle: days <= 90 ? 'short' : undefined })}
                  </p>
                  <p className="num text-sm font-semibold text-white">{usd(Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="p"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: color, stroke: '#0b111d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Recharts is expensive: skip re-renders from the 60 s market refresh when the series hasn't changed
export default memo(PriceChart);
