import { describe, expect, it } from 'vitest';
import { dueAlerts } from './alert-rules';
import type { Asset } from './assets';
import type { PriceAlert } from './alerts';
import type { KindStatus } from './market-context';

const NOW = 1_700_000_000_000;
const fresh: KindStatus = { state: 'ok', error: null, updatedAt: NOW - 1000, stale: false };
const status = { cripto: fresh, divisa: fresh, bolsa: fresh };
const btc = { id: 'bitcoin', kind: 'cripto', price: 100 } as Asset;
const alert = (o: Partial<PriceAlert> = {}): PriceAlert => ({ id: 'a1', assetId: 'bitcoin', assetName: 'Bitcoin', direction: 'above', price: 90, createdAt: 0, ...o });

describe('dueAlerts', () => {
  it('dispara hacia arriba y hacia abajo según el precio', () => {
    expect(dueAlerts([alert()], [btc], status, NOW, new Set())).toHaveLength(1);
    expect(dueAlerts([alert({ price: 110 })], [btc], status, NOW, new Set())).toHaveLength(0);
    expect(dueAlerts([alert({ direction: 'below', price: 110 })], [btc], status, NOW, new Set())).toHaveLength(1);
    expect(dueAlerts([alert({ direction: 'below', price: 90 })], [btc], status, NOW, new Set())).toHaveLength(0);
  });

  it('el precio exacto cuenta como cumplido', () => {
    expect(dueAlerts([alert({ price: 100 })], [btc], status, NOW, new Set())).toHaveLength(1);
  });

  it('no dispara con datos viejos ni con copia guardada', () => {
    const old: KindStatus = { ...fresh, updatedAt: NOW - 10 * 60_000 };
    expect(dueAlerts([alert()], [btc], { ...status, cripto: old }, NOW, new Set())).toHaveLength(0);
    expect(dueAlerts([alert()], [btc], { ...status, cripto: { ...fresh, stale: true } }, NOW, new Set())).toHaveLength(0);
    expect(dueAlerts([alert()], [btc], { ...status, cripto: { ...fresh, updatedAt: null } }, NOW, new Set())).toHaveLength(0);
  });

  it('no repite una alerta ya disparada o ya avisada', () => {
    expect(dueAlerts([alert({ triggeredAt: NOW - 5 })], [btc], status, NOW, new Set())).toHaveLength(0);
    expect(dueAlerts([alert()], [btc], status, NOW, new Set(['a1']))).toHaveLength(0);
  });

  it('ignora alertas de activos que ya no existen', () => {
    expect(dueAlerts([alert({ assetId: 'dogecoin' })], [btc], status, NOW, new Set())).toHaveLength(0);
  });
});
