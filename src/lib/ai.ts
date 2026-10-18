import type { Chat, GoogleGenAI } from '@google/genai';
import { KIND_META, fmtPrice, type Asset } from './assets';
import { SIGNAL_META, type Signal } from './indicators';
import { pct } from './format';

const apiKey = process.env.API_KEY;
// Con VITE_API_PROXY (Worker de Funda) la clave de Gemini vive en el servidor y el navegador no la ve
const proxy = (import.meta.env.VITE_API_PROXY as string | undefined)?.replace(/\/$/, '');
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// shortcut: sin VITE_API_PROXY la clave viaja en el bundle (convención de AI Studio); en un hosting público usa el Worker.
export const aiEnabled = !!(proxy || apiKey);
// The SDK is only downloaded when a key is configured and the AI is actually used
let aiPromise: Promise<GoogleGenAI> | null = null;
const getAI = () => (aiPromise ??= import('@google/genai').then(({ GoogleGenAI }) => new GoogleGenAI(proxy ? { apiKey: 'proxy', httpOptions: { baseUrl: proxy } } : { apiKey })));

const SYSTEM = `Eres "Funda IA", un tutor de inversiones y mercados para principiantes de Latinoamérica (el público principal vive en El Salvador, donde la moneda es el dólar).
Cubres inversión en general: ahorro, interés compuesto, inflación, acciones, bonos, ETFs, oro, divisas y criptomonedas.
Reglas:
- Responde siempre en español claro y cercano. Usa analogías de la vida diaria para explicar términos complejos.
- Sé breve: máximo 180 palabras salvo que pidan más detalle. Usa viñetas cortas con "•" cuando ayuden.
- No uses tablas ni encabezados. Puedes resaltar palabras clave con **negritas**.
- Nunca prometas ganancias ni des asesoría financiera personalizada. Si preguntan "¿compro X?", explica qué indican las señales educativas actuales, los riesgos, el horizonte de inversión y sugiere ideas prudentes (fondo de emergencia, diversificar, invertir de a poco, no usar dinero que necesite pronto).
- Si el tema no es finanzas, inversiones, economía o cripto, redirige amablemente.
- Recuerda advertencias de seguridad cuando aplique: nunca compartir la frase semilla ni claves, verificar URLs y regulación, desconfiar de promesas de rendimiento fijo.`;

export function marketContext(assets: Asset[], signals: Record<string, Signal>): string {
  return assets
    .map((a) => {
      const s = signals[a.id];
      return `${a.name} (${a.symbol}, ${KIND_META[a.kind].label}): ${fmtPrice(a, a.price)}, ${KIND_META[a.kind].changeLabel} ${pct(a.change1d)}, 7d ${pct(a.change7d)}${
        s ? `, señal educativa: ${SIGNAL_META[s.level].label}, RSI ${s.rsi?.toFixed(0) ?? 'n/d'}` : ''
      }`;
    })
    .join('\n');
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/** A chat seeded with earlier turns, so it can be rebuilt with fresh market data on every message. */
export async function createChat(context: string, history: ChatTurn[] = []): Promise<Chat | null> {
  if (!aiEnabled) return null;
  const ai = await getAI();
  return ai.chats.create({
    model: MODEL,
    history: history.filter((m) => m.text.trim()).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: `${SYSTEM}\n\nDatos de mercado (${new Date().toLocaleString('es-419')}):\n${context || 'no disponibles'}`,
    },
  });
}

export async function marketSummary(context: string): Promise<string | null> {
  if (!aiEnabled || !context) return null;
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Con estos datos, escribe un resumen de los mercados de hoy (cripto, bolsa y divisas, según lo disponible) para un principiante en 3 viñetas cortas (máx. 70 palabras en total). Termina recordando que no es asesoría financiera.\n\n${context}`,
    config: { systemInstruction: SYSTEM },
  });
  return res.text ?? null;
}
