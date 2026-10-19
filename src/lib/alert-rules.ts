import type { Asset, AssetKind } from './assets';
import { isStale, type KindStatus } from './market-context';
import type { PriceAlert } from './alerts';

/** Alertas que se cumplen ahora. Nunca con datos viejos, ni dos veces la misma, ni una ya disparada. */
export function dueAlerts(alerts: PriceAlert[], assets: Asset[], status: Record<AssetKind, KindStatus>, now: number, notified: Set<string>) {
  return alerts.flatMap((a) => {
    const asset = assets.find((x) => x.id === a.assetId);
    if (!asset || a.triggeredAt || notified.has(a.id) || isStale(asset.kind, status[asset.kind], now)) return [];
    const hit = a.direction === 'above' ? asset.price >= a.price : asset.price <= a.price;
    return hit ? [{ a, asset }] : [];
  });
}
