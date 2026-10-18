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
          'Las criptomonedas son muy volátiles: puedes perder parte o todo lo que inviertas. Antes de invertir, infórmate y considera consultar a un asesor autorizado en tu país.',
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
          'Los precios provienen de CoinGecko y pueden tener retrasos o errores. Las respuestas del asistente las genera Google Gemini y pueden contener imprecisiones: verifica la información importante.',
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
          'Para mostrar precios consultamos la API pública de CoinGecko. Las preguntas que escribes al asistente se envían a Google Gemini para generar la respuesta: no escribas datos personales o sensibles en el chat.',
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
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Inicio
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-400">Última actualización: {UPDATED}</p>
        <div className="card mt-8 space-y-8 p-6 sm:p-10">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold">{s.h}</h2>
              {s.p.map((p) => (
                <p key={p} className="mt-2 leading-relaxed text-slate-300">
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
