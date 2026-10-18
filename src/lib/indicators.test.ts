import { describe, expect, it } from 'vitest';
import { analyze, rsi, sma, volatility } from './indicators';

const ramp = (n: number, start: number, step: number) => Array.from({ length: n }, (_, i) => start + i * step);

describe('indicators', () => {
  it('sma averages the last N values', () => {
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
    expect(sma([1], 2)).toBeNull();
  });

  it('rsi is 100 on a pure uptrend, 0 on a pure downtrend, 50 when flat', () => {
    expect(rsi(ramp(30, 100, 1))).toBe(100);
    expect(rsi(ramp(30, 100, -1))).toBe(0);
    expect(rsi(Array(30).fill(5))).toBe(50);
    expect(rsi([1, 2, 3])).toBeNull();
  });

  it('volatility is 0 for constant growth rate', () => {
    const series = Array.from({ length: 40 }, (_, i) => 100 * 1.01 ** i);
    expect(volatility(series)).toBeCloseTo(0, 6);
  });

  it('flags a parabolic rally as caution', () => {
    const s = analyze([...ramp(80, 100, 0.5), ...ramp(10, 140, 6)]);
    expect(s.level).toBe('precaucion');
  });

  it('flags a pullback inside an uptrend as favorable', () => {
    // long uptrend, then a gentle dip that cools RSI while SMA20 stays above SMA50
    const up = ramp(80, 100, 1);
    const dip = ramp(14, 178, -1.5);
    const s = analyze([...up, ...dip]);
    expect(s.smaShort! > s.smaLong!).toBe(true);
    expect(s.rsi!).toBeLessThan(45);
    expect(s.level).toBe('favorable');
  });

  it('is neutral with insufficient data', () => {
    expect(analyze([1, 2, 3]).level).toBe('neutral');
  });
});
