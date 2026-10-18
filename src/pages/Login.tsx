import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { BellRing, Bot, ChartLine, Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import { authError, useAuth } from '../lib/auth';
import { APP_NAME, Logo } from '../components/ui';

export default function Login({ mode }: { mode: 'login' | 'register' }) {
  const { user, demo, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/app';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const isLogin = mode === 'login';

  if (user) return <Navigate to={from} replace />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await fn(); // once `user` is set, the <Navigate> above redirects
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() => (isLogin ? signIn(form.email, form.password) : signUp(form.name, form.email, form.password)));
  };

  const forgot = async () => {
    setError('');
    if (!form.email) return setError('Escribe tu correo arriba y vuelve a pulsar "¿Olvidaste tu contraseña?".');
    try {
      await resetPassword(form.email);
      setInfo('Te enviamos un correo para restablecer tu contraseña.');
    } catch (e) {
      setError(authError(e));
    }
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="glow relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-surface/50 p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="text-4xl leading-tight font-bold">
            Tu guía para invertir en cripto <span className="gradient-text">con criterio</span>
          </h2>
          <ul className="mt-10 space-y-5 text-slate-300">
            <li className="flex items-center gap-3"><ChartLine className="h-5 w-5 text-emerald-400" aria-hidden /> Precios y gráficas en tiempo real</li>
            <li className="flex items-center gap-3"><BellRing className="h-5 w-5 text-emerald-400" aria-hidden /> Señales y alertas automáticas</li>
            <li className="flex items-center gap-3"><Bot className="h-5 w-5 text-emerald-400" aria-hidden /> Asistente con IA que explica todo</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">Herramienta educativa. No es asesoría financiera.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-bold lg:mt-0">{isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h1>
          <p className="mt-2 text-slate-400">
            {isLogin ? `Ingresa a tu panel de ${APP_NAME}.` : 'Es gratis y toma menos de un minuto.'}
          </p>

          {demo && (
            <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
              <strong>Modo demo:</strong> Firebase aún no está configurado. Puedes entrar con cualquier correo y una contraseña de 6+ caracteres; la
              sesión se guarda solo en este navegador.
            </p>
          )}

          {!demo && (
            <>
              <button type="button" className="btn btn-ghost mt-8 w-full py-3" disabled={busy} onClick={() => run(signInWithGoogle)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
                </svg>
                Continuar con Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                <span className="h-px flex-1 bg-white/10" /> o con tu correo <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={submit} className={`space-y-4 ${demo ? 'mt-6' : ''}`} noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre</label>
                <input id="name" className="input" autoComplete="name" placeholder="Tu nombre" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Correo electrónico</label>
              <input id="email" type="email" className="input" autoComplete="email" placeholder="tu@correo.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">Contraseña</label>
                {isLogin && !demo && (
                  <button type="button" onClick={forgot} className="text-xs text-emerald-400 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-300"
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
              </p>
            )}
            {info && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{info}</p>}

            <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Link to={isLogin ? '/registro' : '/login'} state={{ from }} className="font-semibold text-emerald-400 hover:underline">
              {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
            </Link>
          </p>
          {!isLogin && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Al crear tu cuenta aceptas que {APP_NAME} es una herramienta educativa y no brinda asesoría financiera.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
