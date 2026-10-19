import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index.js';

const env = { GEMINI_API_KEY: 'g-secret', TWELVEDATA_KEY: 't-secret', ALLOWED_ORIGINS: 'https://traceyn.pages.dev, https://example.org/' };
const ctx = { waitUntil: () => {} };
const call = (path: string, init: RequestInit & { origin?: string } = {}, e: Record<string, string> = env) =>
  worker.fetch(new Request('https://api.test' + path, { ...init, headers: { origin: init.origin ?? 'https://traceyn.pages.dev', 'content-type': 'application/json' } }), e, ctx);

afterEach(() => vi.unstubAllGlobals());

describe('worker proxy', () => {
  it('rechaza orígenes no permitidos y peticiones sin origen', async () => {
    expect((await call('/stocks?symbol=SPY&outputsize=5', { origin: 'https://malo.com' })).status).toBe(403);
    expect((await worker.fetch(new Request('https://api.test/stocks?symbol=SPY&outputsize=5'), env, ctx)).status).toBe(403);
  });

  it('acepta el origen con barra final en la lista y responde el preflight', async () => {
    const res = await call('/v1beta/models/gemini-flash-latest:generateContent', { method: 'OPTIONS', origin: 'https://example.org' });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://example.org');
  });

  it('valida símbolos y tamaño antes de llamar a Twelve Data', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    for (const q of ['symbol=AAPL&outputsize=5', 'symbol=SPY&outputsize=0', 'symbol=SPY&outputsize=9999', 'symbol=&outputsize=5'])
      expect((await call('/stocks?' + q)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('añade la clave de Twelve Data en el servidor', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"values":[]}'));
    vi.stubGlobal('fetch', f);
    const res = await call('/stocks?symbol=SPY,QQQ&outputsize=90');
    expect(res.status).toBe(200);
    expect(f.mock.calls[0][0]).toContain('apikey=t-secret');
    expect(f.mock.calls[0][0]).toContain('symbol=SPY,QQQ');
  });

  it('reenvía solo rutas de generateContent a Gemini con la clave del servidor', async () => {
    const f = vi.fn().mockResolvedValue(new Response('data: {}', { headers: { 'content-type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', f);
    const ok = await call('/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse', { method: 'POST', body: '{"contents":[]}' });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toBe('text/event-stream');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse');
    expect(init.headers['x-goog-api-key']).toBe('g-secret');
    expect((await call('/v1beta/files', { method: 'POST', body: '{}' })).status).toBe(404);
    expect((await call('/v1beta/models/gemini-flash-latest:generateContent', { method: 'GET' })).status).toBe(404);
  });

  it('limita el tamaño del cuerpo y avisa si falta un secreto', async () => {
    vi.stubGlobal('fetch', vi.fn());
    expect((await call('/v1beta/models/gemini-flash-latest:generateContent', { method: 'POST', body: 'a'.repeat(130 * 1024) })).status).toBe(413);
    expect((await call('/v1beta/models/gemini-flash-latest:generateContent', { method: 'POST', body: '{}' }, { ALLOWED_ORIGINS: env.ALLOWED_ORIGINS })).status).toBe(503);
  });

  it('solo permite el modelo de la app y descarta parámetros extra', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', f);
    expect((await call('/v1beta/models/gemini-2.5-pro:generateContent', { method: 'POST', body: '{}' })).status).toBe(404);
    expect(f).not.toHaveBeenCalled();
    await call('/v1beta/models/gemini-flash-latest:generateContent?key=otra&alt=json', { method: 'POST', body: '{}' });
    expect(f.mock.calls[0][0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
  });

  it('frena a una IP que pregunta demasiado y no a las demás', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    const from = (ip: string) =>
      worker.fetch(
        new Request('https://api.test/v1beta/models/gemini-flash-latest:generateContent', { method: 'POST', body: '{}', headers: { origin: 'https://traceyn.pages.dev', 'cf-connecting-ip': ip } }),
        env,
        ctx,
      );
    for (let i = 0; i < 20; i++) expect((await from('1.1.1.1')).status).toBe(200);
    expect((await from('1.1.1.1')).status).toBe(429);
    expect((await from('2.2.2.2')).status).toBe(200);
  });
});
