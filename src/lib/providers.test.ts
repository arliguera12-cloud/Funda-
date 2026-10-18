import { describe, expect, it } from 'vitest';
import { cryptoAssets, fmtPrice, fxAssets, stockAssets } from './assets';
import { parseFx } from './fx';
import { parseHistory, parseMarkets, type Coin } from './market';
import { parseTwelve } from './stocks';

const coin = (over: Partial<Coin> = {}): Coin => ({
  id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'x.png', current_price: 100, market_cap: 1e12, market_cap_rank: 1,
  total_volume: 1e9, high_24h: 105, low_24h: 95, price_change_percentage_24h: 2, price_change_percentage_7d_in_currency: 5,
  circulating_supply: 19e6, ath: 120, ath_change_percentage: -16, sparkline_in_7d: { price: [1, 2, 3] }, ...over,
});

describe('crypto', () => {
  it('drops malformed coins and rejects non-arrays', () => {
    expect(parseMarkets([coin(), { id: 'x', current_price: null }, null])).toHaveLength(1);
    expect(() => parseMarkets({ status: { error_code: 10002 } })).toThrow();
    expect(() => parseMarkets([])).toThrow();
  });

  it('parses history and ignores bad points', () => {
    expect(parseHistory({ prices: [[1, 2], [3, NaN], 'x', [4, 0]] })).toEqual([[1, 2]]);
    expect(() => parseHistory({})).toThrow();
  });

  it('survives null metrics', () => {
    const [a] = cryptoAssets([coin({ market_cap: null, price_change_percentage_24h: null, sparkline_in_7d: null, market_cap_rank: null })]);
    expect(a.change1d).toBeNull();
    expect(a.spark).toEqual([]);
    expect(a.stats.find(([k]) => k === 'Ranking')?.[1]).toBe('—');
  });

  it('puts the live price at the end of the closes', () => {
    const [a] = cryptoAssets([coin()], { bitcoin: [[1, 90], [2, 95]] });
    expect(a.closes).toEqual([90, 100]);
  });
});

describe('fx (Frankfurter)', () => {
  const raw = {
    rates: {
      '2026-10-05': { EUR: 0.9, MXN: 18 },
      '2026-10-09': { EUR: 0.91, MXN: 18.5 },
      '2026-10-12': { EUR: 0.92, MXN: 19 },
      '2026-10-16': { EUR: 0.9, MXN: 18 },
    },
  };

  it('parses dates in order and groups by currency', () => {
    const s = parseFx(raw);
    expect(s.dates.at(-1)).toBe('2026-10-16');
    expect(s.values.EUR).toEqual([0.9, 0.91, 0.92, 0.9]);
    expect(() => parseFx({})).toThrow();
    expect(() => parseFx({ rates: { '2026-10-05': { EUR: 1 } } })).toThrow();
  });

  it('computes 1-day and 7-calendar-day changes and shows rates with their unit', () => {
    const [eur] = fxAssets(parseFx(raw));
    expect(eur.id).toBe('eur');
    expect(eur.change1d).toBeCloseTo((0.9 / 0.92 - 1) * 100, 6);
    expect(eur.change7d).toBeCloseTo((0.9 / 0.91 - 1) * 100, 6); // 16 oct − 7 d = 9 oct
    expect(fmtPrice(eur, 0.8605)).toBe('0.8605 EUR');
    expect(fmtPrice({ unit: 'rate', symbol: 'JPY' }, 150.1234)).toBe('150.12 JPY');
    expect(fmtPrice({ unit: 'rate', symbol: 'MXN' }, 18.42)).toBe('18.420 MXN');
  });
});

describe('stocks (Twelve Data)', () => {
  const rows = (closes: number[]) => ({
    status: 'ok',
    values: closes.map((c, i) => ({ datetime: `2026-10-${String(16 - i).padStart(2, '0')}`, close: String(c) })), // newest first
  });

  it('reads multi-symbol responses, sorts ascending and skips symbols with errors', () => {
    const s = parseTwelve({ SPY: rows([502, 500, 498]), QQQ: { status: 'error', code: 400 }, GLD: rows([220, 219]) }, ['SPY', 'QQQ', 'GLD']);
    expect(Object.keys(s)).toEqual(['SPY', 'GLD']);
    expect(s.SPY.map((p) => p[1])).toEqual([498, 500, 502]);
  });

  it('reads single-symbol responses', () => {
    expect(parseTwelve(rows([10, 9]), ['TLT']).TLT).toHaveLength(2);
  });

  it('maps provider errors to friendly messages', () => {
    expect(() => parseTwelve({ status: 'error', code: 401 }, ['SPY'])).toThrow(/clave/);
    expect(() => parseTwelve({ status: 'error', code: 429 }, ['SPY'])).toThrow(/límite/);
    expect(() => parseTwelve({ SPY: { status: 'error' } }, ['SPY'])).toThrow(/vacía/);
  });

  it('builds assets with change and stats', () => {
    const [spy] = stockAssets(parseTwelve({ SPY: rows([510, 500, 480]) }, ['SPY']));
    expect(spy.price).toBe(510);
    expect(spy.change1d).toBeCloseTo(2, 6);
    expect(spy.kind).toBe('bolsa');
  });
});
