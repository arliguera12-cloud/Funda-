// Herramientas educativas: cálculos puros, sin red, fáciles de probar.

export interface CompoundInput {
  initial: number;
  monthly: number;
  /** Rendimiento anual nominal, en % (por ejemplo 7). */
  ratePct: number;
  years: number;
  /** Inflación anual esperada, en %. Sirve para mostrar el valor real (poder de compra). */
  inflationPct?: number;
}

export interface CompoundYear {
  year: number;
  contributed: number;
  balance: number;
  /** Saldo en dinero de hoy (descontando la inflación). */
  real: number;
}

/** Interés compuesto con capitalización mensual y aportes al final de cada mes. */
export function compound({ initial, monthly, ratePct, years, inflationPct = 0 }: CompoundInput): CompoundYear[] {
  const r = ratePct / 100 / 12;
  const rows: CompoundYear[] = [{ year: 0, contributed: initial, balance: initial, real: initial }];
  let balance = initial;
  for (let m = 1; m <= Math.round(years * 12); m++) {
    balance = balance * (1 + r) + monthly;
    if (m % 12 === 0 || m === Math.round(years * 12)) {
      const year = m / 12;
      rows.push({
        year,
        contributed: initial + monthly * m,
        balance,
        real: balance / (1 + inflationPct / 100) ** year,
      });
    }
  }
  return rows;
}

export interface DcaResult {
  buys: number;
  invested: number;
  /** Compras periódicas. */
  dca: { units: number; value: number; returnPct: number };
  /** Mismo dinero invertido de una sola vez el primer día. */
  lump: { units: number; value: number; returnPct: number };
}

/** Compara comprar `amount` cada `everyDays` días contra invertir todo el primer día, con precios de cierre reales. */
export function simulateDca(closes: number[], amount: number, everyDays: number): DcaResult | null {
  const prices = closes.filter((c) => Number.isFinite(c) && c > 0);
  if (prices.length < 2 || amount <= 0 || everyDays < 1) return null;
  const last = prices[prices.length - 1];
  let units = 0;
  let buys = 0;
  for (let i = 0; i < prices.length; i += Math.round(everyDays)) {
    units += amount / prices[i];
    buys++;
  }
  const invested = amount * buys;
  const lumpUnits = invested / prices[0];
  const out = (u: number) => ({ units: u, value: u * last, returnPct: (u * last / invested - 1) * 100 });
  return { buys, invested, dca: out(units), lump: out(lumpUnits) };
}

export type RiskProfile = 'conservador' | 'moderado' | 'dinamico';

export interface Question {
  q: string;
  options: { label: string; points: 1 | 2 | 3 | 4 }[];
}

export const QUESTIONS: Question[] = [
  {
    q: '¿Cuándo vas a necesitar este dinero?',
    options: [
      { label: 'En menos de 2 años', points: 1 },
      { label: 'Entre 2 y 5 años', points: 2 },
      { label: 'Entre 5 y 10 años', points: 3 },
      { label: 'En más de 10 años', points: 4 },
    ],
  },
  {
    q: 'Tu inversión cae 20 % en un mes. ¿Qué haces?',
    options: [
      { label: 'Vendo todo para no perder más', points: 1 },
      { label: 'Vendo una parte', points: 2 },
      { label: 'Espero sin hacer nada', points: 3 },
      { label: 'Aprovecho para comprar más', points: 4 },
    ],
  },
  {
    q: '¿Cuántos meses de gastos tienes ahorrados aparte (fondo de emergencia)?',
    options: [
      { label: 'Ninguno', points: 1 },
      { label: '1 a 2 meses', points: 2 },
      { label: '3 a 5 meses', points: 3 },
      { label: '6 meses o más', points: 4 },
    ],
  },
  {
    q: '¿Qué tan estables son tus ingresos?',
    options: [
      { label: 'Muy variables', points: 1 },
      { label: 'Algo variables', points: 2 },
      { label: 'Bastante estables', points: 3 },
      { label: 'Fijos y seguros', points: 4 },
    ],
  },
  {
    q: '¿Cuánta experiencia tienes invirtiendo?',
    options: [
      { label: 'Ninguna', points: 1 },
      { label: 'Solo ahorro en el banco', points: 2 },
      { label: 'He invertido algo (fondos, acciones, cripto)', points: 3 },
      { label: 'Invierto con regularidad', points: 4 },
    ],
  },
  {
    q: '¿Qué prefieres?',
    options: [
      { label: 'Proteger mi dinero, aunque gane poco', points: 1 },
      { label: 'Ganar un poco más que la inflación', points: 2 },
      { label: 'Crecer, aceptando algunas caídas', points: 3 },
      { label: 'Crecer al máximo, aceptando caídas fuertes', points: 4 },
    ],
  },
];

export function scoreProfile(points: number[]): RiskProfile {
  const avg = points.reduce((a, b) => a + b, 0) / (points.length || 1);
  return avg < 2.1 ? 'conservador' : avg < 3.1 ? 'moderado' : 'dinamico';
}

export const PROFILES: Record<
  RiskProfile,
  { name: string; summary: string; mix: { label: string; pct: number }[] }
> = {
  conservador: {
    name: 'Conservador',
    summary: 'Priorizas no perder. Te conviene que la mayor parte esté en ahorro y bonos, y una porción pequeña en activos que crecen.',
    mix: [
      { label: 'Ahorro y bonos', pct: 70 },
      { label: 'Acciones y ETFs', pct: 25 },
      { label: 'Oro', pct: 5 },
      { label: 'Cripto', pct: 0 },
    ],
  },
  moderado: {
    name: 'Moderado',
    summary: 'Buscas equilibrio: aceptas caídas temporales a cambio de crecer por encima de la inflación en varios años.',
    mix: [
      { label: 'Ahorro y bonos', pct: 45 },
      { label: 'Acciones y ETFs', pct: 45 },
      { label: 'Oro', pct: 5 },
      { label: 'Cripto', pct: 5 },
    ],
  },
  dinamico: {
    name: 'Dinámico',
    summary: 'Tu horizonte es largo y toleras caídas fuertes. Aun así conviene mantener un colchón y diversificar.',
    mix: [
      { label: 'Ahorro y bonos', pct: 25 },
      { label: 'Acciones y ETFs', pct: 60 },
      { label: 'Oro', pct: 5 },
      { label: 'Cripto', pct: 10 },
    ],
  },
};
