import { describe, expect, it } from 'vitest';
import { glossaryAnswer } from './ai';

describe('glossaryAnswer', () => {
  it('prefers the most specific term', () => {
    expect(glossaryAnswer('¿Qué significa tokenizar?')).toMatch(/^\*\*Tokenizar\*\*/);
    expect(glossaryAnswer('¿qué es un token?')).toMatch(/^\*\*Token\*\*/);
  });

  it('understands common misspellings and accents', () => {
    expect(glossaryAnswer('que es blockcange')).toMatch(/^\*\*Blockchain\*\*/);
    expect(glossaryAnswer('DIVERSIFICACIÓN')).toMatch(/^\*\*Diversificación\*\*/);
  });

  it('falls back politely for unknown terms', () => {
    expect(glossaryAnswer('receta de pizza')).toMatch(/glosario/);
  });
});
