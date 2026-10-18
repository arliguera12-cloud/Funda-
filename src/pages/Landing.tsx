import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BellRing, BookOpen, Bot, ChartLine, GraduationCap, ShieldCheck, Sparkles, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { PublicFooter } from '../components/PublicChrome';
import { useMarket } from '../lib/market-context';
import { usd } from '../lib/format';
import { APP_NAME, Change, Logo, SignalBadge, Skeleton, Sparkline } from '../components/ui';

const FEATURES = [
  { icon: ChartLine, title: 'Precios en vivo', text: 'Bitcoin, Ethereum, XRP, BNB y Solana actualizados cada minuto, con gráficas de 24 horas a 1 año.' },
  { icon: Activity, title: 'Señales automáticas', text: 'Calculamos RSI, medias móviles y volatilidad para decirte si el momento es favorable, neutral o de precaución.' },
  { icon: BellRing, title: 'Alertas inteligentes', text: 'Te avisamos cuando una cripto llega al precio que elegiste o cuando cambia su señal.' },
  { icon: Bot, title: 'Asistente con IA', text: 'Pregúntale a Funda IA (Gemini) cualquier término complicado y recibe una explicación simple al instante.' },
  { icon: GraduationCap, title: 'Academia cripto', text: 'Glosario de +45 términos, fichas de cada moneda y guías paso a paso para empezar seguro.' },
  { icon: Wallet, title: 'Billeteras y exchanges', text: 'Accesos directos a las plataformas oficiales más usadas, con lo que necesitas saber de cada una.' },
];

const STEPS = [
  { n: '01', title: 'Crea tu cuenta', text: 'Regístrate gratis en segundos con tu correo o con Google.' },
  { n: '02', title: 'Aprende lo esencial', text: 'Entiende blockchain, billeteras y riesgos con explicaciones sin tecnicismos.' },
  { n: '03', title: 'Sigue señales y alertas', text: 'Deja que Funda vigile el mercado por ti y decide con información, no con FOMO.' },
];

const FAQ = [
  { q: '¿Funda me dice qué comprar?', a: 'No. Funda es una herramienta educativa: muestra indicadores técnicos calculados automáticamente y te explica qué significan. La decisión siempre es tuya.' },
  { q: '¿Funda guarda mi dinero o mis criptos?', a: 'No. Funda no custodia fondos ni ejecuta operaciones. Compras y guardas tus criptos en el exchange o billetera que elijas.' },
  { q: '¿Qué tan confiables son las señales?', a: 'Se basan en indicadores usados por analistas (RSI, medias móviles de 20 y 50 días, volatilidad). Ayudan a evitar decisiones impulsivas, pero ningún indicador predice el futuro.' },
  { q: '¿Necesito mucho dinero para empezar?', a: 'No. Puedes comprar fracciones de una cripto desde pocos dólares. Recomendamos empezar con montos pequeños y la estrategia DCA.' },
  { q: '¿Es gratis?', a: 'Sí, todas las funciones actuales son gratuitas.' },
];

const TERMS = ['Blockchain', 'Tokenizar', 'Wallet', 'Staking', 'DCA', 'Frase semilla', 'Stablecoin', 'Halving'];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Landing() {
  const { user } = useAuth();
  const { coins, signals } = useMarket();
  const cta = user ? { to: '/app', label: 'Ir a mi panel' } : { to: '/registro', label: 'Comenzar gratis' };

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex" aria-label="Secciones">
            {[
              ['funciones', 'Funciones'],
              ['como-funciona', 'Cómo funciona'],
              ['academia', 'Academia'],
              ['faq', 'Preguntas'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="transition hover:text-white">
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
                Iniciar sesión
              </Link>
            )}
            <Link to={cta.to} className="btn btn-primary">
              {user ? 'Mi panel' : 'Crear cuenta'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="glow relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div className="animate-[fadeUp_.6s_ease-out]">
            <span className="chip gap-2 border-emerald-400/30 text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Datos en vivo · Señales automáticas · IA Gemini
            </span>
            <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-6xl">
              Invierte en cripto <span className="gradient-text">entendiendo</span> lo que haces
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-400">
              {APP_NAME} es tu guía de inversiones: te explica cada criptomoneda y término complicado, vigila el mercado por ti y te avisa
              cuándo el momento es favorable y cuándo conviene esperar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={cta.to} className="btn btn-primary px-6 py-3 text-base">
                {cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button onClick={() => scrollTo('como-funciona')} className="btn btn-ghost px-6 py-3 text-base">
                Ver cómo funciona
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" aria-hidden /> Actualización cada 60 s</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden /> No custodiamos tus fondos</span>
              <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" aria-hidden /> +45 términos explicados</span>
            </div>
          </div>

          {/* Live preview */}
          <div className="card relative p-5 shadow-2xl shadow-emerald-500/5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display font-semibold text-white">Mercado ahora</p>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> En vivo
              </span>
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {coins.length
                ? coins.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <img src={c.image} alt="" className="h-8 w-8 rounded-full" />
                      <div className="w-20 sm:w-24">
                        <p className="text-sm font-semibold text-white">{c.symbol.toUpperCase()}</p>
                        <p className="truncate text-xs text-slate-500">{c.name}</p>
                      </div>
                      <Sparkline data={c.sparkline_in_7d?.price ?? []} className="hidden h-8 flex-1 sm:block" />
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold text-white tabular-nums">{usd(c.current_price)}</p>
                        <Change value={c.price_change_percentage_24h} className="text-xs" />
                      </div>
                      <div className="hidden w-24 justify-end sm:flex">
                        <SignalBadge level={signals[c.id]?.level} />
                      </div>
                    </li>
                  ))
                : Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="my-3 h-10" />)}
            </ul>
          </div>
        </div>

        {/* Ticker */}
        {coins.length > 0 && (
          <div className="border-y border-white/[0.06] bg-white/[0.02] py-3" aria-hidden>
            <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-10">
              {[...coins, ...coins, ...coins, ...coins].map((c, i) => (
                <span key={i} className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <span className="font-semibold text-white">{c.symbol.toUpperCase()}</span>
                  <span className="text-slate-400 tabular-nums">{usd(c.current_price)}</span>
                  <Change value={c.price_change_percentage_24h} className="text-xs" />
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section id="funciones" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-emerald-400">Todo en un solo lugar</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Lo que necesitas para invertir con criterio</h2>
          <p className="mt-4 text-slate-400">Automatizamos el trabajo pesado: seguimiento de precios, análisis técnico y alertas. Tú te enfocas en aprender y decidir.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card group p-6 transition hover:border-emerald-400/30">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 transition group-hover:bg-emerald-400/20">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-emerald-400">Cómo funciona</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">De principiante a inversionista informado en 3 pasos</h2>
              <ol className="mt-10 space-y-8">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="font-display text-2xl font-bold text-emerald-400/60">{s.n}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-slate-400">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold">¿Cómo decidimos la señal?</h3>
              <p className="mt-2 text-sm text-slate-400">Cada minuto analizamos 90 días de precios de cada moneda con tres indicadores clásicos:</p>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="font-semibold text-white">RSI (Índice de fuerza relativa)</dt>
                  <dd className="mt-1 text-slate-400">Detecta si una cripto está "cara" (sobrecompra) o "barata" (sobreventa).</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Medias móviles de 20 y 50 días</dt>
                  <dd className="mt-1 text-slate-400">Muestran la tendencia de fondo: alcista o bajista.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Volatilidad y momentum</dt>
                  <dd className="mt-1 text-slate-400">Te advierten de subidas demasiado rápidas y de movimientos bruscos.</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-2">
                <SignalBadge level="favorable" long />
                <SignalBadge level="neutral" long />
                <SignalBadge level="precaucion" long />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy preview */}
      <section id="academia" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-semibold text-emerald-400">Academia</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Los términos difíciles, explicados fácil</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          ¿Qué es tokenizar? ¿Cómo recibo cripto? ¿Qué es una frase semilla? Lo explicamos con ejemplos de la vida diaria y, si te queda una duda,
          nuestro asistente con IA te responde.
        </p>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
          {TERMS.map((t) => (
            <span key={t} className="chip px-4 py-2 text-sm">{t}</span>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5 open:border-emerald-400/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                {f.q}
                <span className="text-xl text-slate-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-transparent p-10 text-center sm:p-14">
          <h2 className="text-3xl font-bold sm:text-4xl">Empieza a invertir con información, no con intuición</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Crea tu cuenta gratis y deja que {APP_NAME} vigile el mercado por ti.</p>
          <Link to={cta.to} className="btn btn-primary mt-8 px-8 py-3 text-base">
            {cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
