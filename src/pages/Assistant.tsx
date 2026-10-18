import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Chat } from '@google/genai';
import { Bot, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { aiEnabled, createChat, glossaryAnswer, marketContext } from '../lib/ai';
import { useMarket } from '../lib/market-context';
import { useAuth } from '../lib/auth';
import { renderBold } from '../components/ui';

interface Msg {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = [
  '¿Qué es blockchain?',
  '¿Qué significa tokenizar?',
  '¿Cómo recibo criptomonedas?',
  '¿Es buen momento para invertir en Bitcoin?',
  '¿Qué es una frase semilla?',
  '¿Qué es el DCA?',
];

export default function Assistant() {
  const { user } = useAuth();
  const { coins, signals } = useMarket();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const chat = useRef<Chat | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'model', text: '' }]);
    const write = (t: string) => setMessages((m) => [...m.slice(0, -1), { role: 'model', text: t }]);

    try {
      if (!aiEnabled) return write(glossaryAnswer(q));
      chat.current ??= createChat(marketContext(coins, signals));
      let acc = '';
      for await (const chunk of await chat.current!.sendMessageStream({ message: q })) {
        acc += chunk.text ?? '';
        write(acc);
      }
    } catch (e) {
      console.error(e);
      write('No pude responder en este momento (puede ser un límite de uso de la IA). Mientras tanto, esto dice el glosario:\n\n' + glossaryAnswer(q));
    } finally {
      setBusy(false);
    }
  };

  // Questions sent from other screens (e.g. "Explícamelo con IA")
  const preset = params.get('q');
  const lastPreset = useRef<string | null>(null);
  useEffect(() => {
    if (preset && preset !== lastPreset.current && (coins.length || !aiEnabled)) {
      lastPreset.current = preset;
      setParams({}, { replace: true });
      send(preset);
    }
  }, [preset, coins.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col lg:h-[calc(100dvh-7rem)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Funda IA</h1>
          <p className="mt-1 text-sm text-slate-400">Tu tutor de inversiones: pregunta cualquier término o duda, sin pena.</p>
        </div>
        <span className={`chip gap-1.5 ${aiEnabled ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-300'}`}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> {aiEnabled ? 'Gemini' : 'Modo glosario'}
        </span>
      </div>

      <div className="card mt-5 flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Bot className="h-7 w-7" aria-hidden />
                </span>
                <p className="mt-4 font-semibold text-white">Hola {user!.name.split(' ')[0]}, ¿qué quieres aprender hoy?</p>
                <p className="mt-1 text-sm text-slate-500">Conozco los precios y señales actuales del mercado.</p>
                <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="chip px-3 py-2 text-sm transition hover:border-emerald-400/40 hover:text-white">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'model' && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <Bot className="h-4 w-4" aria-hidden />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 font-medium text-ink' : 'bg-white/[0.04] text-slate-200'
                }`}
              >
                {m.text ? renderBold(m.text) : <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" aria-label="Escribiendo" />}
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-white/[0.06] p-3 sm:p-4">
          <label htmlFor="msg" className="sr-only">Escribe tu pregunta</label>
          <input
            id="msg"
            className="input"
            placeholder="Ej.: ¿Qué es el staking y es seguro?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary px-4" disabled={busy || !input.trim()} aria-label="Enviar">
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500">La IA puede equivocarse. No es asesoría financiera.</p>
    </div>
  );
}
