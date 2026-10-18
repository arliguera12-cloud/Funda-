import type { AssetDef } from './assets';
import { fetchFxHistory } from './fx';
import { fetchCryptoHistory, type PricePoint } from './market';
import { fetchStockHistory } from './stocks';

/** Historial de precios de cualquier activo, desde su proveedor. */
export function fetchAssetHistory(a: Pick<AssetDef, 'id' | 'kind' | 'symbol'>, days: number): Promise<PricePoint[]> {
  if (a.kind === 'cripto') return fetchCryptoHistory(a.id, days);
  if (a.kind === 'divisa') return fetchFxHistory(a.symbol, days);
  return fetchStockHistory(a.symbol, days);
}
