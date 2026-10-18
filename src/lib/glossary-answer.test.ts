import { describe, expect, it } from 'vitest';
import { glossaryAnswer } from './glossary-answer';

describe('glossaryAnswer', () => {
  it('prefers the most specific term', () => {
    expect(glossaryAnswer('¿Qué significa tokenizar?')).toMatch(/^\*\*Tokenizar\*\*/);
    expect(glossaryAnswer('¿qué es un token?')).toMatch(/^\*\*Token\*\*/);
  });

  it('understands common misspellings and accents', () => {
    expect(glossaryAnswer('que es blockcange')).toMatch(/^\*\*Blockchain\*\*/);
    expect(glossaryAnswer('DIVERSIFICACIÓN')).toMatch(/^\*\*Diversificación\*\*/);
  });

  it('answers coin questions from the coin profiles', () => {
    expect(glossaryAnswer('Explícame Solana como principiante')).toMatch(/^\*\*Solana \(SOL\)\*\*/);
    expect(glossaryAnswer('¿qué es el halving de bitcoin?')).toMatch(/^\*\*Halving\*\*/);
  });

  it('never gives buy/sell advice offline', () => {
    expect(glossaryAnswer('¿Es buen momento para invertir en Bitcoin?')).toMatch(/No puedo decirte si comprar/);
    expect(glossaryAnswer('¿Cómo comprar mi primera cripto?')).not.toMatch(/No puedo decirte/);
  });

  it('matches whole words only', () => {
    expect(glossaryAnswer('¿Cómo recibo criptomonedas?')).toMatch(/^\*\*Dirección\*\*/);
    expect(glossaryAnswer('tarjeta de credito')).not.toMatch(/^\*\*Red\*\*/);
    expect(glossaryAnswer('¿Qué son los tokens?')).toMatch(/^\*\*Token\*\*/);
  });

  it('falls back politely for unknown terms', () => {
    expect(glossaryAnswer('receta de pizza')).toMatch(/glosario/);
  });
});
