import { GoogleGenAI, type Chat } from '@google/genai';
import type { Coin } from './market';
import { SIGNAL_META, type Signal } from './indicators';
import { pct, usd } from './format';
import { GLOSSARY } from '../data/glossary';
import { COIN_PROFILES } from '../data/learn';

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

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/** A chat seeded with earlier turns, so it can be rebuilt with fresh market data on every message. */
export function createChat(context: string, history: ChatTurn[] = []): Chat | null {
  if (!ai) return null;
  return ai.chats.create({
    model: MODEL,
    history: history.filter((m) => m.text.trim()).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
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

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word match (plural allowed), so "red" doesn't match inside "credito"
const hasWord = (text: string, word: string) => new RegExp(`(^|[^a-z0-9])${escape(word)}(s|es)?([^a-z0-9]|$)`).test(text);

const INTENT = /(buen momento|es momento de|(debo|deberia|conviene|vale la pena) (comprar|vender|invertir)|(^|[^a-z])(compro|vendo|invierto) )/;

/** Offline answer from the built-in glossary and coin profiles, used when Gemini is not configured or fails. */
export function glossaryAnswer(question: string): string {
  const q = normalize(question);
  if (INTENT.test(q)) {
    return 'No puedo decirte si comprar o vender, pero sí qué mirar:\n• Abre la moneda en el **Panel** y revisa su señal y sus razones (RSI, tendencia y volatilidad).\n• Invierte solo lo que puedas permitirte perder.\n• Considera comprar en partes cada semana o mes (**DCA**) en lugar de todo de una vez.';
  }
  // Longest match wins, so "tokenizar" beats "token"
  let hit: (typeof GLOSSARY)[number] | undefined;
  let best = 0;
  for (const g of GLOSSARY) {
    for (const t of [g.term, ...(g.aliases ?? [])].map(normalize)) {
      if (t.length > best && hasWord(q, t)) [hit, best] = [g, t.length];
    }
  }
  const generic = !hit || hit.term === 'Criptomoneda';
  const coin = generic && COIN_PROFILES.find((p) => hasWord(q, normalize(p.name)) || hasWord(q, p.symbol.toLowerCase()));
  if (coin) {
    return `**${coin.name} (${coin.symbol})**: ${coin.tagline}\n${coin.what}\n\n**Para qué se usa:** ${coin.useCase}\n**Riesgo:** ${coin.risk}`;
  }
  if (hit) return `**${hit.term}**\n${hit.definition}\n\n**Ejemplo:** ${hit.example}`;
  return 'Todavía no tengo ese término en mi glosario. Prueba con palabras como "blockchain", "tokenizar", "billetera", "staking" o "DCA", o búscalo en la Academia.';
}
