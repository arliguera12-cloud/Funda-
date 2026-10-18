import { describe, expect, it } from 'vitest';
import { autoSummary } from './summary';
import type { Asset } from './assets';
import type { Signal } from './indicators';

const a = (id: string, name: string, change1d: number | null): Asset =>
  ({ id, name, change1d, kind: 'cripto', symbol: id.toUpperCase(), price: 1, unit: 'usd', tagline: '', change7d: null, spark: [], closes: [], stats: [] }) as Asset;
const sig = (level: Signal['level']) => ({ level }) as Signal;

describe('autoSummary', () => {
  it('names the best and worst mover and lists signals', () => {
    const lines = autoSummary([a('x', 'Uno', 3), a('y', 'Dos', -2), a('z', 'Tres', 0.5)], { x: sig('favorable'), y: sig('precaucion') });
    expect(lines[0]).toContain('**2 de 3**');
    expect(lines[0]).toContain('**Uno** (+3.00%)');
    expect(lines[0]).toContain('**Dos** (-2.00%)');
    expect(lines[1]).toBe('Señal favorable en: Uno.');
    expect(lines[2]).toContain('Precaución en: Dos');
  });

  it('is empty without data and tolerates null changes', () => {
    expect(autoSummary([], {})).toEqual([]);
    expect(autoSummary([a('x', 'Uno', null)], {})).toEqual([]);
  });
});
