import { GoogleGenAI, type Chat } from '@google/genai';
import type { Coin } from './market';
import { SIGNAL_META, type Signal } from './indicators';
import { pct, usd } from './format';
import { GLOSSARY } from '../data/glossary';

const apiKey = process.env.API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// shortcut: the key ships in the client bundle (AI Studio convention); deploy via AI Studio/Cloud Run proxy or add a backend before going public.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
export const aiEnabled = !!ai;

const SYSTEM = `Eres "Funda IA", un tutor experto en inversiones y criptomonedas para principiantes de Latinoamérica.
Reglas:
- Responde siempre en español claro y cercano. Usa analogías de la vida diaria para explicar términos complejos.
- Sé breve: máximo 180 palabras salvo que pidan más detalle. Usa viñetas cortas con "•" cuando ayuden.
- No uses tablas ni encabezados. Puedes resaltar palabras clave con **negritas**.
- Nunca prometas ganancias ni des asesoría financiera personalizada. Si preguntan "¿compro X?", explica qué indican las señales educativas actuales, los riesgos y sugiere estrategias prudentes (DCA, diversificar, no invertir dinero que necesites).
- Si el tema no es finanzas, inversiones, economía o cripto, redirige amablemente.
- Recuerda advertencias de seguridad cuando aplique: nunca compartir la frase semilla, verificar URLs, desconfiar de promesas de rendimiento fijo.`;

export function marketContext(coins: Coin[], signals: Record<string, Signal>): string {
  return coins
    .map((c) => {
      const s = signals[c.id];
      return `${c.name} (${c.symbol.toUpperCase()}): ${usd(c.current_price)}, 24h ${pct(c.price_change_percentage_24h)}, 7d ${pct(
        c.price_change_percentage_7d_in_currency,
      )}${s ? `, señal educativa: ${SIGNAL_META[s.level].label}, RSI ${s.rsi?.toFixed(0) ?? 'n/d'}` : ''}`;
    })
    .join('\n');
}

export function createChat(context: string): Chat | null {
  if (!ai) return null;
  return ai.chats.create({
    model: MODEL,
    config: {
      systemInstruction: `${SYSTEM}\n\nDatos de mercado en tiempo real (${new Date().toLocaleString('es-419')}):\n${context || 'no disponibles'}`,
    },
  });
}

export async function marketSummary(context: string): Promise<string | null> {
  if (!ai || !context) return null;
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Con estos datos, escribe un resumen del mercado cripto de hoy para un principiante en 3 viñetas cortas (máx. 70 palabras en total). Termina recordando que no es asesoría financiera.\n\n${context}`,
    config: { systemInstruction: SYSTEM },
  });
  return res.text ?? null;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Offline answer from the built-in glossary, used when Gemini is not configured. */
export function glossaryAnswer(question: string): string {
  const q = normalize(question);
  // Longest match wins, so "tokenizar" beats "token"
  let hit: (typeof GLOSSARY)[number] | undefined;
  let best = 0;
  for (const g of GLOSSARY) {
    for (const t of [g.term, ...(g.aliases ?? [])].map(normalize)) {
      if (t.length > best && q.includes(t)) [hit, best] = [g, t.length];
    }
  }
  if (hit) return `**${hit.term}**\n${hit.definition}\n\n💡 ${hit.example}`;
  return 'Todavía no tengo ese término en mi glosario. Prueba con palabras como "blockchain", "tokenizar", "wallet", "staking" o "DCA". (Activa Gemini con tu API key para respuestas completas.)';
}
