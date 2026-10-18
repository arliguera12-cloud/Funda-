import { describe, expect, it } from 'vitest';
import { PROFILES, QUESTIONS, compound, scoreProfile, simulateDca } from './calc';

describe('compound', () => {
  it('without interest it just adds contributions', () => {
    const rows = compound({ initial: 1000, monthly: 100, ratePct: 0, years: 2 });
    expect(rows.at(-1)).toMatchObject({ year: 2, contributed: 3400, balance: 3400, real: 3400 });
  });

  it('compounds monthly and matches the closed form', () => {
    const [, r1] = compound({ initial: 1000, monthly: 0, ratePct: 12, years: 1 });
    expect(r1.balance).toBeCloseTo(1000 * 1.01 ** 12, 6);
  });

  it('shows purchasing power lost to inflation', () => {
    const last = compound({ initial: 1000, monthly: 0, ratePct: 5, years: 10, inflationPct: 5 }).at(-1)!;
    expect(last.real).toBeLessThan(last.balance);
    expect(last.real).toBeGreaterThan(1000); // monthly compounding beats the 5 % annual inflation slightly
  });
});

describe('simulateDca', () => {
  it('equals lump sum on a flat price', () => {
    const r = simulateDca(Array(30).fill(100), 50, 7)!;
    expect(r.buys).toBe(5);
    expect(r.invested).toBe(250);
    expect(r.dca.returnPct).toBeCloseTo(0);
    expect(r.lump.returnPct).toBeCloseTo(0);
  });

  it('beats lump sum when the price keeps falling, loses when it keeps rising', () => {
    const down = Array.from({ length: 30 }, (_, i) => 100 - i);
    const up = Array.from({ length: 30 }, (_, i) => 100 + i);
    const d = simulateDca(down, 10, 5)!;
    const u = simulateDca(up, 10, 5)!;
    expect(d.dca.returnPct).toBeGreaterThan(d.lump.returnPct);
    expect(u.dca.returnPct).toBeLessThan(u.lump.returnPct);
  });

  it('rejects bad input', () => {
    expect(simulateDca([100], 10, 7)).toBeNull();
    expect(simulateDca([100, 101], 0, 7)).toBeNull();
    expect(simulateDca([100, 101], 10, 0)).toBeNull();
  });
});

describe('risk profile', () => {
  it('maps answers to a profile and every mix sums to 100', () => {
    expect(scoreProfile(QUESTIONS.map(() => 1))).toBe('conservador');
    expect(scoreProfile(QUESTIONS.map(() => 3))).toBe('moderado');
    expect(scoreProfile(QUESTIONS.map(() => 4))).toBe('dinamico');
    for (const p of Object.values(PROFILES)) expect(p.mix.reduce((a, m) => a + m.pct, 0)).toBe(100);
  });
});
