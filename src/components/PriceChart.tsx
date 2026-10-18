import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '../lib/market';
import { compact, usd } from '../lib/format';

export default function PriceChart({ data, days }: { data: PricePoint[]; days: number }) {
  const up = data.length > 1 && data[data.length - 1][1] >= data[0][1];
  const color = up ? '#34d399' : '#fb7185';
  const fmtTime = (t: number) =>
    new Date(t).toLocaleString('es-419', days <= 1 ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data.map(([t, p]) => ({ t, p }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} minTickGap={40} />
        <YAxis
          dataKey="p"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => (v >= 1000 ? compact(v) : usd(v))}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={72}
          orientation="right"
        />
        <Tooltip
          contentStyle={{ background: '#0b111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          labelFormatter={(t) => new Date(Number(t)).toLocaleString('es-419', { dateStyle: 'medium', timeStyle: 'short' })}
          formatter={(v) => [usd(Number(v)), 'Precio']}
        />
        <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} fill="url(#fill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
