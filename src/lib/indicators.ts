export type SignalLevel = 'favorable' | 'neutral' | 'precaucion';

export interface Signal {
  level: SignalLevel;
  score: number;
  rsi: number | null;
  smaShort: number | null;
  smaLong: number | null;
  change7d: number | null;
  volatility: number | null;
  reasons: string[];
}

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  return values.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Wilder's RSI
export function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

// Std dev of daily % returns over the last `period` days
export function volatility(values: number[], period = 30): number | null {
  if (values.length <= period) return null;
  const slice = values.slice(-period - 1);
  const returns = slice.slice(1).map((v, i) => (v / slice[i] - 1) * 100);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return Math.sqrt(returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length);
}

/** Educational signal from daily closing prices (oldest → newest). Not financial advice. */
export function analyze(closes: number[]): Signal {
  const r = rsi(closes);
  const smaShort = sma(closes, 20);
  const smaLong = sma(closes, 50);
  const last = closes[closes.length - 1];
  const weekAgo = closes[closes.length - 8];
  const change7d = last && weekAgo ? (last / weekAgo - 1) * 100 : null;
  const vol = volatility(closes);
  const reasons: string[] = [];
  let score = 0;

  if (r !== null) {
    if (r < 30) {
      score += 2;
      reasons.push(`RSI en ${r.toFixed(0)}: zona de sobreventa. Muchos vendieron; históricamente suelen venir rebotes.`);
    } else if (r < 45) {
      score += 1;
      reasons.push(`RSI en ${r.toFixed(0)}: el precio se ha enfriado, sin estar caro.`);
    } else if (r > 70) {
      score -= 2;
      reasons.push(`RSI en ${r.toFixed(0)}: zona de sobrecompra. Subió mucho y podría corregir.`);
    } else if (r > 60) {
      score -= 1;
      reasons.push(`RSI en ${r.toFixed(0)}: el impulso comprador ya está avanzado.`);
    } else {
      reasons.push(`RSI en ${r.toFixed(0)}: zona neutral, sin excesos.`);
    }
  }

  if (smaShort !== null && smaLong !== null) {
    if (smaShort > smaLong) {
      score += 1;
      reasons.push('La media de 20 días está sobre la de 50: tendencia alcista de mediano plazo.');
    } else {
      score -= 1;
      reasons.push('La media de 20 días está bajo la de 50: tendencia bajista de mediano plazo.');
    }
  }

  if (change7d !== null && change7d > 20) {
    score -= 1;
    reasons.push(`Subió ${change7d.toFixed(1)}% en 7 días: comprar tras subidas tan rápidas (FOMO) es riesgoso.`);
  }

  if (vol !== null && vol > 5) {
    reasons.push(`Volatilidad alta (${vol.toFixed(1)}% diario): el precio puede moverse fuerte en ambas direcciones.`);
  }

  const level: SignalLevel = score >= 2 ? 'favorable' : score <= -2 ? 'precaucion' : 'neutral';
  return { level, score, rsi: r, smaShort, smaLong, change7d, volatility: vol, reasons };
}

export const SIGNAL_META: Record<SignalLevel, { label: string; short: string; tone: string }> = {
  favorable: { label: 'Momento favorable', short: 'Favorable', tone: 'emerald' },
  neutral: { label: 'Esperar / Neutral', short: 'Neutral', tone: 'amber' },
  precaucion: { label: 'Precaución', short: 'Precaución', tone: 'rose' },
};
