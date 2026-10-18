import { ExternalLink, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import { EXCHANGES, WALLETS, type Platform } from '../data/platforms';

function PlatformCard({ p }: { p: Platform }) {
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/10 font-display font-bold text-emerald-300" aria-hidden>
          {p.name[0]}
        </span>
        <h3 className="text-lg font-semibold">{p.name}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-300">{p.description}</p>
      <p className="mt-2 text-sm text-slate-400"><strong className="text-slate-200">Ideal para:</strong> {p.bestFor}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.tags.map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>
      <div className="mt-auto pt-5">
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full">
          Sitio oficial <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export default function Platforms() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Billeteras y exchanges</h1>
        <p className="mt-1 text-slate-400">Accesos a los sitios oficiales de las plataformas más usadas. Verifica siempre que estén disponibles en tu país.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="flex items-center gap-2 font-semibold text-white"><Landmark className="h-5 w-5 text-emerald-400" aria-hidden /> Exchange (casa de cambio)</p>
          <p className="mt-2 text-sm text-slate-400">Donde compras y vendes cripto con dinero normal. La plataforma guarda tus fondos (custodia): es cómodo, pero dependes de ella.</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 font-semibold text-white"><Wallet className="h-5 w-5 text-emerald-400" aria-hidden /> Billetera (wallet)</p>
          <p className="mt-2 text-sm text-slate-400">Donde tú guardas tus cripto con tus propias llaves (autocustodia). Más control y más responsabilidad: si pierdes tu frase semilla, pierdes el acceso.</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Exchanges</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {EXCHANGES.map((p) => <PlatformCard key={p.name} p={p} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Billeteras</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {WALLETS.map((p) => <PlatformCard key={p.name} p={p} />)}
        </div>
      </section>

      <div className="card flex gap-3 border-amber-400/20 p-5 text-sm text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
        <p>
          <strong className="text-white">Seguridad primero:</strong> entra siempre desde estos enlaces o desde las tiendas oficiales de apps, activa el
          2FA y nunca compartas tu frase semilla. Funda no tiene relación comercial con estas plataformas ni recibe comisiones.
        </p>
      </div>
    </div>
  );
}
