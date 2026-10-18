import { GLOSSARY } from '../data/glossary';
import { CATALOG } from './assets';
import { PROFILES } from '../data/profiles';

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
  // Todos los términos que aparecen en la pregunta; para el caso general gana el más largo ("tokenizar" gana a "token")
  const found: { g: (typeof GLOSSARY)[number]; len: number; at: number }[] = [];
  for (const g of GLOSSARY) {
    let best = 0;
    let at = -1;
    for (const t of [g.term, ...(g.aliases ?? [])].map(normalize)) {
      if (t.length > best && hasWord(q, t)) [best, at] = [t.length, q.indexOf(t)];
    }
    if (best) found.push({ g, len: best, at });
  }
  const top = [...found].sort((a, b) => b.len - a.len)[0];
  const hit = top?.g;
  // "¿En qué se diferencia X de Y?": se explican ambos, en el orden en que aparecen
  if (/diferenc|versus|\bvs\b|compar/.test(q) && found.length >= 2) {
    const two = [...found].sort((a, b) => b.len - a.len).slice(0, 2).sort((a, b) => a.at - b.at);
    return two.map(({ g }) => `**${g.term}**\n${g.definition}`).join('\n\n');
  }
  const generic = !hit || hit.term === 'Criptomoneda';
  const asset = generic && CATALOG.find((a) => hasWord(q, normalize(a.name)) || hasWord(q, a.symbol.toLowerCase()));
  const profile = asset && PROFILES[asset.id];
  if (asset && profile) {
    return `**${asset.name} (${asset.symbol})**: ${asset.tagline}\n${profile.what}\n\n**Para qué sirve:** ${profile.useCase}\n**Riesgo:** ${profile.risk}`;
  }
  if (hit) return `**${hit.term}**\n${hit.definition}\n\n**Ejemplo:** ${hit.example}`;
  return 'Todavía no tengo ese término en mi glosario. Prueba con palabras como "blockchain", "tokenizar", "billetera", "staking" o "DCA", o búscalo en Aprende.';
}
