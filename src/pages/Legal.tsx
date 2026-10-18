import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PublicFooter, PublicHeader } from '../components/PublicChrome';
import { APP_NAME } from '../components/ui';

const UPDATED = '18 de octubre de 2026';

const DOCS = {
  terminos: {
    title: 'Términos de uso',
    sections: [
      {
        h: 'Qué es Funda',
        p: [
          `${APP_NAME} es una herramienta educativa sobre inversiones y criptomonedas. Muestra precios públicos, indicadores técnicos calculados automáticamente, alertas de precio y explicaciones generadas con inteligencia artificial.`,
        ],
      },
      {
        h: 'No es asesoría financiera',
        p: [
          'Nada de lo que ves en Funda es una recomendación de compra o venta. Las señales ("favorable", "neutral", "precaución") resumen indicadores técnicos del pasado y no predicen el futuro.',
          'Todas las inversiones pueden perder valor y las criptomonedas son especialmente volátiles: puedes perder parte o todo lo que inviertas. Antes de invertir, infórmate y considera consultar a un asesor autorizado en tu país.',
        ],
      },
      {
        h: 'No custodiamos fondos',
        p: [
          'Funda no compra, vende, guarda ni transfiere criptomonedas, y nunca te pedirá tu frase semilla ni tus claves privadas. Si alguien te las pide en nombre de Funda, es una estafa.',
        ],
      },
      {
        h: 'Datos e inteligencia artificial',
        p: [
          'Los precios provienen de CoinGecko (cripto), del Banco Central Europeo vía Frankfurter (divisas) y de Twelve Data (bolsa y ETFs), y pueden tener retrasos o errores. Los datos de divisas y bolsa son de cierre diario. Las respuestas del asistente las genera Google Gemini y pueden contener imprecisiones: verifica la información importante.',
        ],
      },
      {
        h: 'Enlaces a terceros',
        p: [
          'Incluimos enlaces a sitios oficiales de exchanges y billeteras solo como referencia. No tenemos relación comercial con ellos ni respondemos por sus servicios. Verifica que estén disponibles y regulados en tu país.',
        ],
      },
    ],
  },
  privacidad: {
    title: 'Aviso de privacidad',
    sections: [
      {
        h: 'Qué datos guardamos',
        p: [
          'Tu nombre y correo para identificarte. Si usas la versión de prueba, esos datos, tus alertas y tus preferencias se guardan solo en tu navegador (almacenamiento local) y no salen de tu dispositivo.',
          'Si la cuenta se crea con Firebase Authentication (Google), Google procesa tu correo y tu contraseña cifrada para gestionar el inicio de sesión.',
        ],
      },
      {
        h: 'Qué no guardamos',
        p: ['No pedimos ni guardamos datos bancarios, tarjetas, frases semilla, claves privadas ni direcciones de billetera.'],
      },
      {
        h: 'Servicios externos',
        p: [
          'Para mostrar precios consultamos las APIs de CoinGecko, Frankfurter y, si está activada, Twelve Data. Las preguntas que escribes al asistente se envían a Google Gemini para generar la respuesta: no escribas datos personales o sensibles en el chat.',
        ],
      },
      {
        h: 'Tus decisiones',
        p: [
          'Puedes cerrar sesión cuando quieras. Para borrar los datos de la versión de prueba, borra los datos del sitio en la configuración de tu navegador.',
        ],
      },
    ],
  },
};

export default function Legal({ kind }: { kind: keyof typeof DOCS }) {
  const doc = DOCS[kind];
  return (
    <div className="flex min-h-dvh flex-col">
      <title>{`${doc.title} · ${APP_NAME}`}</title>
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <Link to="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Inicio
        </Link>
        <header className="rule-double mt-4 pt-5 pb-6">
          <p className="kicker">Legal · Actualizado el {UPDATED}</p>
          <h1 className="mt-2 text-[clamp(2.2rem,6vw,3.5rem)] leading-[1.02]">{doc.title}</h1>
        </header>
        <div className="mt-6 space-y-9">
          {doc.sections.map((s, i) => (
            <section key={s.h}>
              <h2 className="text-2xl">
                <span className="kicker mr-3 align-middle">{String(i + 1).padStart(2, '0')}</span>
                {s.h}
              </h2>
              {s.p.map((p) => (
                <p key={p} className="mt-3 text-[17px] leading-relaxed text-ink-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
