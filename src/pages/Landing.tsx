import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Lightbulb, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useMarket } from '../lib/market-context';
import { compound } from '../lib/calc';
import { KIND_META } from '../lib/assets';
import { GLOSSARY } from '../data/glossary';
import { PublicFooter, PublicHeader } from '../components/PublicChrome';
import { AssetMark, Change, Price, SectionHead, SignalBadge, SignalMeter, Skeleton, Sparkline, prefersReducedMotion } from '../components/ui';

const FAQ = [
  { q: '¿Trace YN guarda mi dinero o mis inversiones?', a: 'No. Trace YN no custodia fondos, no compra ni vende por ti y no se conecta a tus cuentas. Compras y guardas lo que elijas en la plataforma que tú decidas.' },
  { q: '¿Trace YN me va a pedir mi frase semilla o acceso a mi billetera?', a: 'Nunca. Si alguien te pide tu frase semilla, tus claves o acceso a tu cuenta diciendo que es de Trace YN, es una estafa.' },
  { q: '¿Trace YN me dice qué comprar?', a: 'No. Trace YN es una herramienta educativa: muestra indicadores calculados automáticamente y te explica qué significan. La decisión siempre es tuya.' },
  { q: '¿Cómo gana dinero Trace YN?', a: 'Hoy Trace YN es gratis. No vendemos inversiones, no cobramos comisiones y no recibimos pagos de las plataformas que aparecen en la app.' },
  { q: '¿Necesito saber de finanzas?', a: 'No. Trace YN está pensada para quien empieza desde cero: cada término tiene una explicación simple y un ejemplo, y puedes preguntarle a Trace YN IA lo que no entiendas.' },
  { q: '¿Puedo usar Trace YN desde El Salvador?', a: 'Sí. Trace YN funciona desde cualquier país y muestra los precios en dólares (USD). Antes de abrir una cuenta en una plataforma, verifica en su sitio oficial que acepte usuarios de tu país.' },
  { q: '¿Necesito mucho dinero para empezar?', a: 'No. Puedes empezar con montos pequeños. Lo más importante es la constancia: invertir un poco cada mes (estrategia DCA) suele pesar más que acertar el momento.' },
  { q: '¿Qué tan confiables son las señales?', a: 'Se basan en indicadores que usan los analistas (RSI, medias móviles de 20 y 50 días, volatilidad). Ayudan a evitar decisiones impulsivas, pero ningún indicador predice el futuro.' },
  { q: '¿Es gratis?', a: 'Sí. Crear tu cuenta y usar Trace YN es gratis, sin tarjeta.' },
];

const TERMS = ['ETF', 'Inflación', 'Interés compuesto', 'Bono', 'Diversificación', 'DCA', 'Blockchain', 'Frase semilla'];

const SECTIONS = [
  ['mercados', 'Mercados'],
  ['calculadora', 'Calculadora'],
  ['como-funciona', 'Cómo funciona'],
  ['aprende', 'Aprende'],
  ['faq', 'Preguntas'],
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  el?.focus({ preventScroll: true });
};

/** Calculadora de interés compuesto, viva en la portada: muestra de inmediato el poder de la constancia. */
function MiniCalculator() {
  const [monthly, setMonthly] = useState(50);
  const [years, setYears] = useState(20);
  const id = useId();
  const rows = compound({ initial: 0, monthly, ratePct: 7, years, inflationPct: 3 });
  const last = rows[rows.length - 1];
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-419')}`;
  return (
    <div className="panel-hard p-5 sm:p-6">
      <p className="kicker">Calculadora · interés compuesto</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor={`${id}-m`} className="label !mb-0">Ahorro cada mes</label><output className="num text-sm font-semibold">{fmt(monthly)}</output></div>
          <input id={`${id}-m`} type="range" min={10} max={500} step={10} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="mt-2 h-8 w-full cursor-pointer accent-[var(--ink)]" />
        </div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor={`${id}-y`} className="label !mb-0">Durante</label><output className="num text-sm font-semibold">{years} años</output></div>
          <input id={`${id}-y`} type="range" min={5} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-2 h-8 w-full cursor-pointer accent-[var(--ink)]" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-ink pt-4">
        <div>
          <p className="text-sm text-ink-2">Podrías juntar (con un 7 % anual de ejemplo)</p>
          <p className="num text-[clamp(2.4rem,8vw,3.6rem)] leading-none font-semibold" aria-live="polite">{fmt(last.balance)}</p>
        </div>
        <p className="text-right text-xs text-ink-2">de los cuales<br /><strong className="num text-sm text-ink">{fmt(last.contributed)}</strong> los pones tú</p>
      </div>
      <p className="mt-3 text-xs text-ink-2">Ejemplo educativo, no una promesa de rendimiento. Con 3 % de inflación, eso equivale hoy a {fmt(last.real)}.</p>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { assets, signals, status, signalsReady } = useMarket();
  const cta = user ? { to: '/app', label: 'Ir a mi panel' } : { to: '/registro', label: 'Crear mi cuenta gratis' };
  const [term, setTerm] = useState('Interés compuesto');
  const entry = GLOSSARY.find((t) => t.term === term) ?? GLOSSARY[0];
  const btc = assets.find((a) => a.id === 'bitcoin');
  const featured = assets.filter((a) => ['bitcoin', 'ethereum', 'eur', 'spy', 'gld', 'mxn'].includes(a.id)).slice(0, 5);
  const rows = featured.length ? featured : assets.slice(0, 5);
  const noData = !assets.length && Object.values(status).every((s) => s.state === 'error' || s.state === 'sin-clave');

  // Revelado al hacer scroll: solo si el navegador lo soporta, para que el contenido nunca quede invisible
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute('data-visible', '');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <title>Trace YN · Aprende a invertir sin tecnicismos</title>
      <PublicHeader
        nav={
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex" aria-label="Secciones">
            {SECTIONS.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="rounded-[3px] py-2 text-ink-2 underline-offset-8 transition-colors hover:text-ink hover:underline">
                {label}
              </button>
            ))}
          </nav>
        }
      />

      <main id="contenido" tabIndex={-1} className="outline-none">
        {/* Portada */}
        <section className="shell grid gap-x-12 gap-y-10 pt-12 pb-16 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
          <div>
            <p className="kicker animate-rise [--rise:10px]">Para quienes empiezan desde cero</p>
            <h1 className="mt-4 text-[clamp(2.7rem,7vw,5rem)] leading-[0.98] animate-rise [--rise:14px] [animation-delay:60ms]">
              Invierte entendiendo <em className="mark not-italic">lo que haces</em>
            </h1>
            <p className="mt-6 max-w-[34rem] font-display text-[1.35rem] leading-snug text-ink-2 animate-rise [animation-delay:120ms]">
              Acciones, ETFs, divisas y cripto en un solo lugar, con señales explicadas en palabras simples y un tutor con IA que responde tus dudas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-rise [animation-delay:180ms]">
              <Link to={cta.to} className="btn btn-primary btn-lg">
                {cta.label} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <button onClick={() => scrollTo('calculadora')} className="btn btn-ghost btn-lg">
                Prueba la calculadora
              </button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2 animate-rise [animation-delay:240ms]">
              <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-ink" aria-hidden /> Nunca tocamos tu dinero</li>
              <li>Gratis, sin tarjeta</li>
              <li>Precios en dólares</li>
            </ul>
          </div>

          {/* Tabla del día */}
          <div className="animate-rise [--rise:12px] [animation-delay:160ms]">
            <div className="panel-hard shadow-[5px_5px_0_0_var(--ink)]">
              <div className="flex items-center justify-between border-b border-ink px-4 py-3">
                <p className="kicker !text-ink">Mercados hoy</p>
                <p className="num flex items-center gap-1.5 text-xs text-ink-2"><span aria-hidden className="size-1.5 bg-up" /> en vivo</p>
              </div>
              {noData ? (
                <p className="p-6 text-sm text-ink-2">Los precios no están disponibles por ahora. Vuelve a intentarlo en un momento.</p>
              ) : rows.length ? (
                <ul className="divide-y divide-line px-4">
                  {rows.map((a, i) => (
                    <li key={a.id} className="animate-fade-in grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3" style={{ animationDelay: `${i * 50}ms` }}>
                      <AssetMark asset={a} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.name}</p>
                        <Sparkline data={a.spark} className="mt-0.5 h-5 w-full max-w-24" />
                      </div>
                      <div className="text-right">
                        <Price value={a.price} asset={a} className="block text-[15px] font-semibold" />
                        <Change value={a.change1d} className="text-xs" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="divide-y divide-line px-4" role="status">
                  <span className="sr-only">Cargando precios…</span>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3"><Skeleton className="size-9" /><Skeleton className="h-9 flex-1" /></div>
                  ))}
                </div>
              )}
              <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-2">Cripto: CoinGecko · Divisas: Banco Central Europeo · Los datos diarios se actualizan al cierre.</p>
            </div>
          </div>
        </section>

        {/* Qué cubre */}
        <section id="mercados" tabIndex={-1} className="shell scroll-mt-20 py-16 outline-none">
          <div data-reveal>
            <SectionHead n="01" title="Todos los mercados, en español claro" aside={<Link to={cta.to} className="link">Ver los mercados</Link>} />
            <div className="grid gap-px border border-line bg-line md:grid-cols-3">
              {(['bolsa', 'cripto', 'divisa'] as const).map((k, i) => (
                <div key={k} className="bg-paper p-6">
                  <p className="kicker">{String(i + 1).padStart(2, '0')} · {KIND_META[k].label}</p>
                  <h3 className="mt-2 text-2xl">{KIND_META[k].long}</h3>
                  <p className="mt-2 text-sm text-ink-2">{KIND_META[k].blurb}</p>
                  <p className="mt-4 text-sm font-medium text-ink">
                    {k === 'bolsa' ? 'S&P 500, Nasdaq 100, bonos del Tesoro y oro.' : k === 'cripto' ? 'Bitcoin, Ethereum, XRP, BNB y Solana.' : 'Euro, peso mexicano, real, libra y yen.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal className="mt-14 grid items-center gap-x-12 gap-y-8 lg:grid-cols-2">
            <div>
              <p className="kicker">Señales explicadas</p>
              <h3 className="mt-2 text-[2rem] leading-tight">Cada activo trae su semáforo, y el porqué</h3>
              <p className="mt-3 text-ink-2">Calculamos RSI, medias móviles de 20 y 50 días y volatilidad con los últimos 90 días. Te decimos si la señal es favorable, neutral o de precaución, y lo explicamos con palabras simples. Es información, no una orden de compra.</p>
            </div>
            <div className="panel-hard p-5">
              {btc ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3"><AssetMark asset={btc} /><div><p className="font-semibold">{btc.name}</p><Price value={btc.price} asset={btc} className="text-sm text-ink-2" /></div></div>
                    <SignalBadge level={signals.bitcoin?.level} long ready={signalsReady} />
                  </div>
                  <div className="mt-5"><SignalMeter signal={signals.bitcoin} /></div>
                  <ul className="mt-4 space-y-2 text-sm text-ink-2">
                    {(signals.bitcoin?.reasons ?? []).slice(0, 2).map((r) => <li key={r} className="flex gap-2.5"><span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 bg-ink" />{r}</li>)}
                  </ul>
                </>
              ) : (
                <Skeleton className="h-44" />
              )}
            </div>
          </div>

          <div data-reveal className="mt-14 grid items-center gap-x-12 gap-y-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1 panel-hard p-5">
              <div className="flex items-center gap-3"><Bell className="size-5" aria-hidden /><p className="font-display text-xl font-semibold">Ethereum superó $4,100</p></div>
              <p className="mt-1 text-sm text-ink-2">Aviso en pantalla y en el navegador, con el valor actual.</p>
              <div className="mt-4 h-1 bg-paper-3"><div className="h-full w-4/5 bg-ink" /></div>
              <p className="mt-2 text-xs text-ink-2">Faltan 2.1 % para tu precio objetivo</p>
            </div>
            <div className="order-1 lg:order-2">
              <p className="kicker">Alertas</p>
              <h3 className="mt-2 text-[2rem] leading-tight">Que el mercado te avise a ti</h3>
              <p className="mt-3 text-ink-2">Elige un precio y te avisamos cuando el activo llegue a él, o cuando cambie su señal. Las alertas funcionan mientras tengas Trace YN abierto en tu navegador.</p>
            </div>
          </div>
        </section>

        {/* Calculadora */}
        <section id="calculadora" tabIndex={-1} className="scroll-mt-20 border-y border-ink bg-paper-2 outline-none">
          <div data-reveal className="shell grid items-center gap-x-14 gap-y-8 py-16 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="kicker">02 · Haz las cuentas</p>
              <h2 className="mt-2 text-[clamp(2rem,4.5vw,3rem)] leading-[1.05]">El tiempo trabaja más que tú</h2>
              <p className="mt-4 text-lg text-ink-2">Ahorrar poco, pero con constancia, suele pesar más que ahorrar mucho una sola vez. Mueve los controles y mira cómo crece un ahorro mensual con interés compuesto.</p>
              <Link to={cta.to} className="link mt-5 inline-flex items-center gap-1.5">Usa la calculadora completa, el simulador de compras periódicas y el test de perfil <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
            <MiniCalculator />
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" tabIndex={-1} className="shell scroll-mt-20 py-16 outline-none">
          <div data-reveal>
            <SectionHead n="03" title="Cómo funciona" />
            <ol className="grid gap-x-10 gap-y-6 md:grid-cols-3">
              {[
                ['Crea tu cuenta', 'Gratis, en menos de un minuto. No pedimos tarjeta ni acceso a tu dinero.'],
                ['Aprende lo esencial', 'Una ruta de cinco guías cortas y un tutor con IA que te explica cada término.'],
                ['Sigue el mercado con calma', 'Revisa las señales, crea alertas y decide con información, no con miedo a quedarte fuera.'],
              ].map(([t, d], i) => (
                <li key={t} className="border-t-[3px] border-ink pt-4">
                  <p className="num text-3xl font-semibold">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 text-2xl">{t}</h3>
                  <p className="mt-2 text-ink-2">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Aprende */}
        <section id="aprende" tabIndex={-1} className="shell scroll-mt-20 pb-16 outline-none">
          <div data-reveal>
            <SectionHead n="04" title="Los términos difíciles, explicados fácil" />
            <div role="group" aria-label="Elige un término" className="flex flex-wrap gap-2">
              {TERMS.map((t) => (
                <button key={t} type="button" aria-pressed={term === t} onClick={() => setTerm(t)} className="chip-btn">
                  {t}
                </button>
              ))}
            </div>
            <div key={term} aria-live="polite" className="mt-6 animate-swap-in border-t border-ink pt-5">
              <h3 className="text-[2rem] leading-tight">{entry.term}</h3>
              <p className="mt-2 max-w-2xl text-lg text-ink">{entry.definition}</p>
              <p className="mt-4 flex max-w-2xl gap-2.5 border-l-[3px] border-mark pl-3 text-ink-2"><Lightbulb className="mt-1 size-4 shrink-0 text-ink" aria-hidden /> {entry.example}</p>
            </div>
            <Link to={cta.to} className="link mt-6 inline-flex items-center gap-1.5">Ver los {GLOSSARY.length} términos y preguntarle a Trace YN IA <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </section>

        {/* Confianza */}
        <section className="border-y border-ink bg-paper-2">
          <div data-reveal className="shell py-16">
            <SectionHead n="05" title="Educación, no promesas" />
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['No tocamos tu dinero', 'Trace YN no guarda fondos ni compra por ti. Tú decides dónde y cuándo.'],
                ['Nunca pedimos tu frase semilla', 'Ni en la app, ni por correo, ni por WhatsApp. Si alguien la pide en nuestro nombre, es una estafa.'],
                ['Sin comisiones escondidas', 'No recibimos pagos de las plataformas que te mostramos.'],
                ['Te mostramos el porqué', 'Cada señal viene con sus razones, explicadas en palabras simples.'],
              ].map(([t, d]) => (
                <div key={t} className="bg-paper p-5">
                  <h3 className="text-xl">{t}</h3>
                  <p className="mt-2 text-sm text-ink-2">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preguntas */}
        <section id="faq" tabIndex={-1} className="shell grid scroll-mt-20 gap-x-14 gap-y-8 py-16 outline-none lg:grid-cols-[1fr_1.7fr]">
          <div data-reveal>
            <p className="kicker">06 · Preguntas</p>
            <h2 className="mt-2 text-[clamp(2rem,4.5vw,3rem)] leading-[1.05]">Lo que más nos preguntan</h2>
            <Link to={cta.to} className="link mt-4 inline-flex items-center gap-1.5"><Sparkles className="size-4" aria-hidden /> ¿Otra duda? Pregúntale a Trace YN IA</Link>
          </div>
          <div data-reveal className="divide-y divide-line border-y border-ink">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group" open={i === 0}>
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3.5 font-display text-xl font-semibold text-ink">
                  {f.q}
                  <Plus className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden />
                </summary>
                <p className="pb-5 text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cierre */}
        <section className="shell pb-8">
          <div data-reveal className="relative overflow-hidden border border-ink bg-paper-2 p-8 sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-10">
            {btc && <Sparkline area data={btc.spark} className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-25 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]" />}
            <div className="relative max-w-xl">
              <h2 className="text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02]">Antes de invertir, <span className="mark">entiende</span> lo que compras</h2>
              <p className="mt-4 text-lg text-ink-2">Crea tu cuenta gratis en menos de un minuto. Sin tarjeta y sin conectar tu dinero.</p>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <Link to={cta.to} className="btn btn-primary btn-lg">
                {cta.label} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <p className="mt-3 text-xs text-ink-2">Herramienta educativa · No es asesoría financiera</p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
