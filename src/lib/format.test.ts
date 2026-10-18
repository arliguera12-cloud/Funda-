import { describe, expect, it } from 'vitest';
import { axisUsd, compact, pct, timeAgo, usd } from './format';

describe('format', () => {
  it('usd uses the $ symbol and sensible decimals', () => {
    expect(usd(112000)).toBe('$112,000.00');
    expect(usd(2.45)).toBe('$2.45');
    expect(usd(0.123456)).toBe('$0.1235');
    expect(usd(null)).toBe('—');
    expect(usd(NaN)).toBe('—');
  });

  it('compact never uses ambiguous "B"/"MRD"/"billones"', () => {
    expect(compact(2.2e12)).toBe('$2,200 mil millones');
    expect(compact(4.95e11)).toBe('$495 mil millones');
    expect(compact(3.705e10)).toBe('$37.1 mil millones');
    expect(compact(19.9e6, false)).toBe('19.9 millones');
    expect(compact(950)).toBe('$950');
    expect(compact(undefined)).toBe('—');
  });

  it('axisUsd keeps chart ticks short', () => {
    expect(axisUsd(114000)).toBe('$114 mil');
    expect(axisUsd(4100)).toBe('$4,100');
    expect(axisUsd(2.45)).toBe('$2.45');
  });

  it('pct signs positive values', () => {
    expect(pct(4.153)).toBe('+4.15%');
    expect(pct(-3.2)).toBe('-3.20%');
    expect(pct(null)).toBe('—');
  });

  it('timeAgo scales units', () => {
    expect(timeAgo(Date.now())).toBe('hace unos segundos');
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('hace 5 min');
    expect(timeAgo(Date.now() - 3 * 3600_000)).toBe('hace 3 h');
  });
});
