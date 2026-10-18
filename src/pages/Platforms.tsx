import { ArrowUpRight, Landmark, ShieldCheck, Wallet, LineChart } from 'lucide-react';
import { BROKERS, EXCHANGES, WALLETS, type Platform } from '../data/platforms';
import { Callout, PageHeader, SectionHead } from '../components/ui';

function Card({ p }: { p: Platform }) {
  const host = new URL(p.url).hostname.replace(/^www\./, '');
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="panel panel-link group relative flex flex-col p-5">
      <ArrowUpRight className="absolute top-5 right-5 size-5 text-ink-3 transition-colors group-hover:text-ink" aria-hidden />
      <span className="grid size-10 place-items-center rounded-[4px] border border-ink bg-paper font-display text-xl font-semibold text-ink" aria-hidden>
        {p.name[0]}
      </span>
      <h3 className="mt-3 pr-8 text-xl leading-tight">{p.name}</h3>
      <p className="num text-xs text-ink-3">{host}</p>
      <p className="mt-3 text-sm text-ink">{p.description}</p>
      <p className="mt-2 text-sm text-ink-2">
        <strong className="font-semibold text-ink">Ideal para:</strong> {p.bestFor}
      </p>
      {p.note && <p className="mt-2 text-xs font-medium text-warn">{p.note}</p>}
      <p className="mt-auto pt-4 font-mono text-[11px] tracking-wide text-ink-2 uppercase">{p.tags.join(' · ')}</p>
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}

const GROUPS = [
  { id: 'brokers', n: '01', title: 'Brokers (acciones, ETFs y bonos)', list: BROKERS },
  { id: 'exchanges', n: '02', title: 'Exchanges de cripto', list: EXCHANGES },
  { id: 'billeteras', n: '03', title: 'Billeteras de cripto', list: WALLETS },
];

export default function Platforms() {
  return (
    <div>
      <title>Plataformas · Funda</title>
      <PageHeader
        kicker="Plataformas"
        title={<>Dónde <span className="mark">invertir</span> y dónde guardar</>}
        description="Accesos a los sitios oficiales de plataformas conocidas. ¿Estás en El Salvador? Los precios de Funda ya están en dólares, tu moneda. Antes de registrarte, revisa en el sitio oficial que acepten usuarios de tu país."
      />

      <Callout tone="warn" icon={ShieldCheck} title="Seguridad primero" className="mt-6">
        Entra siempre desde estos enlaces o desde las tiendas oficiales de apps, activa la verificación en dos pasos y nunca compartas tu frase semilla ni tus claves. Funda no tiene relación comercial con estas plataformas ni recibe comisiones.
      </Callout>

      <dl className="mt-8 grid gap-px border border-line bg-line md:grid-cols-3">
        {[
          { icon: LineChart, t: 'Broker', d: 'Te da acceso a comprar y vender acciones, ETFs y bonos. Es el equivalente de un exchange para los mercados tradicionales.' },
          { icon: Landmark, t: 'Exchange', d: 'Donde compras y vendes cripto con dinero normal. La plataforma guarda tus fondos (custodia): es cómodo, pero dependes de ella.' },
          { icon: Wallet, t: 'Billetera', d: 'Donde tú guardas tu cripto con tus propias llaves. Más control y más responsabilidad: si pierdes tu frase semilla, pierdes el acceso.' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="bg-paper p-5">
            <dt className="flex items-center gap-2 font-display text-xl font-semibold text-ink"><Icon className="size-5" aria-hidden /> {t}</dt>
            <dd className="mt-1.5 text-sm text-ink-2">{d}</dd>
          </div>
        ))}
      </dl>

      {GROUPS.map((g) => (
        <section key={g.id} className="mt-12" aria-labelledby={g.id}>
          <SectionHead id={g.id} n={g.n} title={g.title} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.list.map((p) => (
              <Card key={p.name} p={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
