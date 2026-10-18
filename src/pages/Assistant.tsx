import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, LoaderCircle, RotateCcw, Send, Sparkles } from 'lucide-react';
import { aiEnabled, createChat, marketContext } from '../lib/ai';
import { glossaryAnswer } from '../lib/glossary-answer';
import { useMarket } from '../lib/market-context';
import { useAuth } from '../lib/auth';
import { markStep } from '../lib/onboarding';
import { PageHeader, prefersReducedMotion, renderBold } from '../components/ui';

interface Msg {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = [
  '¿Qué es un ETF y en qué se diferencia de una acción?',
  '¿Qué es la inflación y cómo me afecta?',
  'Explícame el interés compuesto con un ejemplo',
  '¿Cómo empiezo a invertir con poco dinero?',
  '¿Qué es el DCA?',
  '¿Qué es una frase semilla?',
  '¿Qué es blockchain?',
  '¿Qué son los bonos?',
];
const FOLLOW_UPS = ['Dame un ejemplo', '¿Qué riesgos tiene?', 'Explícalo más simple'];
const OFFLINE_MISS = 'Todavía no tengo ese término';

export default function Assistant() {
  const { user } = useAuth();
  const { assets, signals, signalsReady } = useMarket();
  const [params, setParams] = useSearchParams();
  const u = user!;
  const storeKey = `funda:chat:${u.uid}`;
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const m = JSON.parse(sessionStorage.getItem(storeKey) ?? '[]');
      return Array.isArray(m) ? m.filter((x: Msg) => x && typeof x.text === 'string') : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // La conversación sobrevive a ir a un activo y volver
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(messages));
    } catch {
      /* guardar es opcional */
    }
  }, [messages, busy, storeKey]);

  // Se desplaza el contenedor del chat, no la página; y solo si la persona ya estaba al final
  useEffect(() => {
    const el = list.current;
    if (!el || !messages.length) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTo({ top: el.scrollHeight, behavior: busy || prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const previous = messages;
    setInput('');
    setBusy(true);
    setMessages([...previous, { role: 'user', text: q }, { role: 'model', text: '' }]);
    inputRef.current?.focus();
    const write = (t: string) => setMessages((m) => [...m.slice(0, -1), { role: 'model', text: t }]);

    try {
      if (!aiEnabled) {
        write(glossaryAnswer(q));
        markStep(u.uid, 'ai');
        return;
      }
      // Se reconstruye el chat en cada mensaje con datos frescos y los turnos anteriores
      const chat = await createChat(marketContext(assets, signals), previous);
      let acc = '';
      for await (const chunk of await chat!.sendMessageStream({ message: q })) {
        acc += chunk.text ?? '';
        write(acc);
      }
      if (!acc.trim()) write('No obtuve una respuesta esta vez. Esto dice el glosario:\n\n' + glossaryAnswer(q));
      else markStep(u.uid, 'ai');
    } catch (e) {
      console.error(e);
      write('No pude responder en este momento (puede ser un límite de uso de la IA). Mientras tanto, esto dice el glosario:\n\n' + glossaryAnswer(q));
    } finally {
      setBusy(false);
    }
  };

  // Preguntas que llegan desde otras pantallas ("Explícamelo con IA")
  const preset = params.get('q');
  const lastPreset = useRef<string | null>(null);
  useEffect(() => {
    if (preset && preset !== lastPreset.current && ((assets.length && signalsReady) || !aiEnabled)) {
      lastPreset.current = preset;
      setParams({}, { replace: true });
      send(preset);
    }
  }, [preset, assets.length, signalsReady]); // eslint-disable-line

  const suggestions = useMemo(() => (aiEnabled ? SUGGESTIONS : SUGGESTIONS.filter((s) => !glossaryAnswer(s).startsWith(OFFLINE_MISS))).slice(0, 6), []);
  const lastIsModel = messages.length > 0 && messages[messages.length - 1].role === 'model';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div>
      <title>Trace YN IA</title>
      <PageHeader
        kicker={aiEnabled ? 'Tutor con IA' : 'Respuestas del glosario'}
        title={<>Pregunta lo que <span className="mark">no entiendas</span></>}
        description="Tu tutor de inversiones: acciones, bonos, ETFs, divisas y cripto, sin pena y sin tecnicismos."
        actions={
          messages.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMessages([])}>
              <RotateCcw className="size-4" aria-hidden /> Nueva conversación
            </button>
          )
        }
      />

      <div className="mx-auto mt-6 flex h-[68dvh] min-h-[26rem] max-w-3xl flex-col border border-ink bg-paper">
        <div ref={list} role="log" aria-label="Conversación con Trace YN IA" aria-busy={busy} className="flex-1 space-y-7 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div>
              <p className="font-display text-[1.7rem] leading-tight font-semibold text-ink">Hola {u.name.split(' ')[0]}, ¿qué quieres aprender hoy?</p>
              <p className="mt-2 text-sm text-ink-2">Conozco los precios y las señales del momento.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="group flex items-center justify-between gap-3 rounded-[4px] border border-ink/40 bg-paper px-4 py-3 text-left text-sm font-medium text-ink transition-[background-color,transform] hover:bg-paper-3 active:translate-x-px active:translate-y-px">
                    {s}
                    <ArrowUpRight className="size-4 shrink-0 text-ink-2 transition-colors group-hover:text-ink" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="animate-fade-up flex justify-end" style={{ '--rise': '6px' } as React.CSSProperties}>
                <p className="max-w-[85%] rounded-[4px] border border-ink bg-ink px-4 py-2.5 text-[15px] text-on-ink">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="animate-fade-up border-l-[3px] border-ink pl-4" style={{ '--rise': '6px', animationDelay: '80ms' } as React.CSSProperties}>
                <p className="kicker mb-1.5 flex items-center gap-1.5"><Sparkles className="size-3" aria-hidden /> Trace YN IA</p>
                {m.text ? (
                  <div className="max-w-[40rem] text-[17px] leading-relaxed whitespace-pre-wrap text-ink">{renderBold(m.text)}</div>
                ) : (
                  <span role="status" className="flex gap-1 py-2" >
                    <span className="sr-only">Trace YN IA está escribiendo…</span>
                    {[0, 1, 2].map((d) => <span key={d} aria-hidden className="size-1.5 animate-typing bg-ink" style={{ animationDelay: `${d * 150}ms` }} />)}
                  </span>
                )}
              </div>
            ),
          )}
        </div>

        {lastIsModel && !busy && aiEnabled && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-6">
            {FOLLOW_UPS.map((f) => (
              <button key={f} type="button" className="chip-btn !py-1 text-xs" onClick={() => send(f)}>{f}</button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex gap-2 border-t border-ink p-3 sm:p-4">
          <label htmlFor="msg" className="sr-only">Escribe tu pregunta</label>
          <input ref={inputRef} id="msg" className="input" placeholder="Ej.: ¿Qué es un bono y es seguro?" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" maxLength={500} enterKeyHint="send" />
          <button type="submit" className="btn btn-primary btn-icon" aria-disabled={busy || !input.trim() || undefined} aria-label="Enviar">
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          </button>
        </form>
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-ink-2">La IA puede equivocarse. No es asesoría financiera.</p>
    </div>
  );
}
