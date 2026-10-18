import { pct } from './format';
import type { Asset } from './assets';
import type { Signal } from './indicators';

/** Resumen del día sin IA: movimientos y señales, escrito en frases cortas (con **negritas**). */
export function autoSummary(assets: Asset[], signals: Record<string, Signal>): string[] {
  const movers = assets.filter((a) => a.change1d != null);
  if (!movers.length) return [];
  const sorted = [...movers].sort((a, b) => b.change1d! - a.change1d!);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const up = movers.filter((a) => a.change1d! > 0).length;
  const names = (level: Signal['level']) => assets.filter((a) => signals[a.id]?.level === level).map((a) => a.name);
  const fav = names('favorable');
  const caution = names('precaucion');
  const lines = [`**${up} de ${movers.length}** activos suben hoy. Mayor alza: **${best.name}** (${pct(best.change1d)}); mayor baja: **${worst.name}** (${pct(worst.change1d)}).`];
  lines.push(fav.length ? `Señal favorable en: ${fav.join(', ')}.` : 'Hoy ningún activo tiene una señal favorable clara.');
  lines.push(caution.length ? `Precaución en: ${caution.join(', ')} (subió muy rápido o la tendencia es bajista).` : 'No hay señales de precaución fuertes.');
  return lines;
}
