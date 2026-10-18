import { Link } from 'react-router-dom';
import { fmtPrice, type Asset } from '../lib/assets';
import { Change } from './ui';

/** Cinta de precios: una línea de texto monoespaciado, como en las pantallas de una bolsa. */
export default function MarketTape({ assets, className = '' }: { assets: Asset[]; className?: string }) {
  if (!assets.length) return <p className={`num text-xs ${className}`}>Conectando con los mercados…</p>;
  return (
    <ul aria-label="Precios de referencia" className={`relative flex items-center gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] ${className}`}>
      {assets.map((a) => (
        <li key={a.id} className="shrink-0">
          <Link to={`/app/mercado/${a.id}`} className="num flex items-center gap-2 text-xs hover:underline">
            <span className="font-semibold">{a.symbol}</span>
            <span>{fmtPrice(a, a.price)}</span>
            <Change value={a.change1d} inverse />
          </Link>
        </li>
      ))}
    </ul>
  );
}
