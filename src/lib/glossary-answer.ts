import { GLOSSARY } from '../data/glossary';
import { COIN_PROFILES } from '../data/learn';

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
