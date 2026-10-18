// Descarga JSON con caché en localStorage; si la red o el proveedor fallan, sirve lo último guardado.

export interface Cached<T> {
  v: T;
  /** Momento en que se obtuvo el dato (no el de la fuente). */
  t: number;
  /** true cuando falló la red y se sirvió una copia vieja. */
  stale: boolean;
}

const inflight = new Map<string, Promise<unknown>>();
const KEY = (k: string) => `funda:cache:${k}`;

export function friendlyError(e: unknown, status?: number): Error {
  if (status === 429) return new Error('Hay mucha demanda de datos en este momento. Volvemos a intentar en un minuto.');
  if (status && status >= 500) return new Error('El proveedor de datos no responde. Volvemos a intentar en un minuto.');
  if (e instanceof TypeError) return new Error('Sin conexión a internet. Revisa tu red; volvemos a intentar en un minuto.');
  return new Error('No pudimos actualizar los datos. Volvemos a intentar en un minuto.');
}

function readCache<T>(cacheKey: string, validate: (v: unknown) => T): { t: number; v: T } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY(cacheKey)) ?? 'null');
    if (raw && typeof raw.t === 'number') return { t: raw.t, v: validate(raw.v) };
  } catch {
    /* almacenamiento bloqueado o entrada dañada */
  }
  return null;
}

/** Último valor guardado, de cualquier antigüedad: sirve para mostrar datos al instante mientras se actualizan. */
export function peekCached<T>(cacheKey: string, validate: (v: unknown) => T): { v: T; t: number } | null {
  return readCache(cacheKey, validate);
}

export async function getJSON<T>(
  url: string,
  ttlMs: number,
  validate: (v: unknown) => T,
  opts: { force?: boolean; cacheKey?: string } = {},
): Promise<Cached<T>> {
  const cacheKey = opts.cacheKey ?? url;
  const cached = readCache(cacheKey, validate);
  if (!opts.force && cached && Date.now() - cached.t < ttlMs) return { ...cached, stale: false };
  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<Cached<T>>;

  const req = (async (): Promise<Cached<T>> => {
    let res: Response;
    try {
      // Una petición colgada bloquearía todas las siguientes detrás de la misma promesa
      res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    } catch (e) {
      throw friendlyError(e);
    }
    if (!res.ok) throw friendlyError(null, res.status);
    const v = validate(await res.json());
    const t = Date.now();
    try {
      localStorage.setItem(KEY(cacheKey), JSON.stringify({ t, v }));
    } catch {
      /* cuota llena: seguimos sin caché */
    }
    return { v, t, stale: false };
  })()
    .catch((e): Cached<T> => {
      if (cached) return { ...cached, stale: true };
      throw e instanceof Error && !(e instanceof SyntaxError) ? e : friendlyError(e);
    })
    .finally(() => inflight.delete(cacheKey));
  inflight.set(cacheKey, req);
  return req;
}

export const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
