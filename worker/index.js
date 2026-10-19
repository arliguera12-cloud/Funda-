// Proxy de Trace YN (Cloudflare Worker): mantiene las claves de Gemini y Twelve Data fuera del navegador.
//   GET  /stocks?symbol=SPY,QQQ&outputsize=90   -> Twelve Data (con caché en el borde)
//   POST /v1beta/models/<modelo>:generateContent | :streamGenerateContent -> Gemini
// Secretos: GEMINI_API_KEY, TWELVEDATA_KEY. Variable: ALLOWED_ORIGINS (orígenes del sitio, separados por coma).

const GEMINI = 'https://generativelanguage.googleapis.com';
const TWELVE = 'https://api.twelvedata.com/time_series';
const SYMBOLS = new Set(['SPY', 'QQQ', 'TLT', 'GLD']);
// Solo el modelo que usa la app (src/lib/ai.ts): nadie puede pedir otro con tu clave
const GEMINI_PATH = /^\/v1beta\/models\/gemini-flash-latest:(generateContent|streamGenerateContent)$/;
const MAX_BODY = 128 * 1024;
const STOCKS_TTL = 1800;
const LIMIT = 20; // peticiones a Gemini por IP y minuto
const WINDOW = 60_000;
// shortcut: el contador vive en cada instancia del Worker (no se comparte entre centros de datos); para un tope global usa la regla de Rate limiting de Cloudflare.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  if (hits.size > 500) for (const [k, v] of hits) if (v.at(-1) < now - WINDOW) hits.delete(k);
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

const json = (status, body, headers) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

async function stocks(url, env, ctx, cors) {
  const symbols = (url.searchParams.get('symbol') ?? '').toUpperCase().split(',');
  const size = Number(url.searchParams.get('outputsize'));
  if (!symbols.length || symbols.length > SYMBOLS.size || !symbols.every((s) => SYMBOLS.has(s)) || !Number.isInteger(size) || size < 2 || size > 1500)
    return json(400, { error: 'Parámetros no válidos.' }, cors);
  if (!env.TWELVEDATA_KEY) return json(503, { error: 'Bolsa no configurada.' }, cors);

  // La clave nunca entra en la llave de caché
  const cache = globalThis.caches?.default;
  const key = new Request(`https://cache.funda.invalid/stocks?symbol=${symbols.join(',')}&outputsize=${size}`);
  const hit = await cache?.match(key);
  if (hit) return new Response(hit.body, { headers: { 'content-type': 'application/json', ...cors } });

  const res = await fetch(`${TWELVE}?symbol=${symbols.join(',')}&interval=1day&outputsize=${size}&apikey=${env.TWELVEDATA_KEY}`);
  const text = await res.text();
  // Twelve Data responde 200 con {"status":"error"} al agotar el cupo: eso no se guarda
  if (cache && res.ok && !text.includes('"status":"error"'))
    ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${STOCKS_TTL}` } })));
  return new Response(text, { status: res.status, headers: { 'content-type': 'application/json', ...cors } });
}

async function gemini(request, url, env, cors) {
  if (!env.GEMINI_API_KEY) return json(503, { error: 'IA no configurada.' }, cors);
  if (limited(request.headers.get('cf-connecting-ip') ?? 'anon')) return json(429, { error: 'Demasiadas preguntas seguidas. Espera un minuto.' }, cors);
  const body = await request.text();
  if (body.length > MAX_BODY) return json(413, { error: 'Mensaje demasiado largo.' }, cors);
  // Solo ?alt=sse (streaming) pasa a Google; cualquier otro parámetro se descarta
  const search = url.searchParams.get('alt') === 'sse' ? '?alt=sse' : '';
  const res = await fetch(GEMINI + url.pathname + search, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body,
  });
  // Se reenvía el cuerpo sin leerlo: la respuesta en streaming sigue siendo en streaming
  return new Response(res.body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') ?? 'application/json', ...cors } });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return json(403, { error: 'Origen no permitido.' });
    const cors = { 'access-control-allow-origin': origin, vary: 'Origin' };

    if (request.method === 'OPTIONS')
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': request.headers.get('access-control-request-headers') ?? 'content-type', 'access-control-max-age': '86400' },
      });

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/stocks') return stocks(url, env, ctx, cors);
    if (request.method === 'POST' && GEMINI_PATH.test(url.pathname)) return gemini(request, url, env, cors);
    return json(404, { error: 'No encontrado.' }, cors);
  },
};
