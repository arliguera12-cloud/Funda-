import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Check, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { authError, authErrorField, isEmail, useAuth } from '../lib/auth';
import { useMarket } from '../lib/market-context';
import { AssetMark, Callout, Change, Logo, Price, Skeleton, Sparkline, prefersReducedMotion } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';

type Field = 'name' | 'email' | 'password';

const Google = () => (
  <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

export default function Login({ mode }: { mode: 'login' | 'register' }) {
  const { user, demo, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { assets } = useMarket();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/app';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errField, setErrField] = useState<Field | undefined>();
  const [info, setInfo] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const isLogin = mode === 'login';
  const list = assets.filter((a) => ['bitcoin', 'eur', 'spy', 'gld', 'ethereum'].includes(a.id)).slice(0, 4);
  const shown = list.length ? list : assets.slice(0, 4);
  const btc = assets.find((a) => a.id === 'bitcoin');

  // Descarga por adelantado el panel para que entrar se sienta instantáneo
  useEffect(() => {
    import('./Dashboard');
  }, []);

  if (user) return <Navigate to={from} replace />;

  const fail = (e: unknown) => {
    const msg = authError(e);
    setError(msg);
    const f = authErrorField(e);
    setErrField(f);
    if (msg) {
      if (f) document.getElementById(f)?.focus();
      if (!prefersReducedMotion()) formRef.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320, easing: 'ease-out' });
    }
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setErrField(undefined);
    setInfo('');
    try {
      await fn(); // al fijarse `user`, el <Navigate> de arriba redirige
    } catch (e) {
      fail(e);
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
    setErrField(undefined);
    try {
      await resetPassword(form.email);
      setInfo('Te enviamos un correo para restablecer tu contraseña.');
    } catch (e) {
      fail(e);
    }
  };

  const set = (k: Field) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const bad = (f: Field) => errField === f || undefined;
  const pwOk = form.password.length >= 6;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <title>{isLogin ? 'Iniciar sesión · Trace YN' : 'Crear cuenta · Trace YN'}</title>
      {/* Portada (solo escritorio) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-ink bg-paper-2 p-12 lg:flex">
        <Logo size="lg" />
        <div className="relative">
          <p className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.03em]">
            Tu guía para invertir <span className="mark">con criterio</span>
          </p>
          <div className="panel-hard mt-8 max-w-md bg-paper shadow-[5px_5px_0_0_var(--ink)]">
            <p className="kicker border-b border-ink px-4 py-2.5 !text-ink">Mercados hoy</p>
            {shown.length ? (
              <ul className="divide-y divide-line px-4">
                {shown.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <AssetMark asset={a} size="sm" />
                    <span className="flex-1 text-sm font-semibold">{a.name}</span>
                    <Price value={a.price} asset={a} className="text-sm" />
                    <Change value={a.change1d} className="w-20 justify-end text-xs" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2 p-4"><Skeleton className="h-7" /><Skeleton className="h-7" /><Skeleton className="h-7" /></div>
            )}
          </div>
        </div>
        {btc && <Sparkline area data={btc.spark} className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 w-full opacity-25" />}
        <p className="relative text-xs text-ink-2">Herramienta educativa. No es asesoría financiera.</p>
      </aside>

      {/* Formulario */}
      <main id="contenido" className="flex flex-col justify-center px-4 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo size="lg" />
            <ThemeToggle />
          </div>
          <h1 className="text-[2.6rem] leading-[1.02]">{isLogin ? <>Hola <span className="mark">de nuevo</span></> : <>Crea tu cuenta <span className="mark">gratis</span></>}</h1>
          <p className="mt-3 text-ink-2">{isLogin ? 'Entra para ver cómo está el mercado hoy.' : 'Toma menos de un minuto. No pedimos tarjeta ni acceso a tu dinero.'}</p>

          {demo && (
            <Callout tone="warn" title="Versión de prueba" className="mt-6">
              Entra con cualquier correo y una contraseña de 6 caracteres o más. Tu cuenta y tus alertas se guardan solo en este navegador.
            </Callout>
          )}

          {!demo && (
            <>
              <button type="button" className="btn btn-ghost btn-lg mt-8 w-full" aria-disabled={busy || undefined} onClick={() => run(signInWithGoogle)}>
                <Google /> Continuar con Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs text-ink-2"><span className="h-px flex-1 bg-ink/30" /> o con tu correo <span className="h-px flex-1 bg-ink/30" /></div>
            </>
          )}

          <form ref={formRef} onSubmit={submit} className={`space-y-4 ${demo ? 'mt-6' : ''}`} noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="label">Nombre</label>
                <input id="name" className="input" autoComplete="name" placeholder="Tu nombre" value={form.name} onChange={set('name')} aria-invalid={bad('name')} aria-describedby={bad('name') ? 'form-error' : undefined} required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">Correo electrónico</label>
              <input
                id="email" type="email" className="input" autoComplete="email" inputMode="email" placeholder="tu@correo.com" value={form.email} onChange={set('email')}
                onBlur={() => form.email && !isEmail(form.email) && (setErrField('email'), setError('Escribe un correo válido, por ejemplo tu@correo.com.'))}
                aria-invalid={bad('email')} aria-describedby={bad('email') ? 'form-error' : undefined} required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
                {isLogin && !demo && <button type="button" onClick={forgot} className="link text-xs">¿Olvidaste tu contraseña?</button>}
              </div>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="input pr-12" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="••••••"
                  value={form.password} onChange={set('password')} aria-invalid={bad('password')} aria-describedby={`${bad('password') ? 'form-error ' : ''}pw-hint`} required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-pressed={showPw} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-2 hover:text-ink" aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPw ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              {!isLogin && (
                <p id="pw-hint" className={`mt-1.5 flex items-center gap-1.5 text-xs ${pwOk ? 'text-up' : 'text-ink-2'}`}>
                  {pwOk && <Check className="size-3.5" aria-hidden />} Usa al menos 6 caracteres.
                </p>
              )}
              {isLogin && <span id="pw-hint" className="sr-only">Mínimo 6 caracteres</span>}
            </div>

            {error && <Callout id="form-error" tone="danger" className="animate-fade-up [--rise:4px]">{error}</Callout>}
            {info && <Callout tone="success" className="animate-fade-up [--rise:4px]">{info}</Callout>}

            <button type="submit" className="btn btn-primary btn-lg relative w-full" aria-disabled={busy || undefined}>
              {busy && <LoaderCircle className="absolute left-4 size-4 animate-spin" aria-hidden />}
              {busy ? (isLogin ? 'Entrando…' : 'Creando cuenta…') : isLogin ? 'Entrar' : 'Crear mi cuenta gratis'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-2">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Link to={isLogin ? '/registro' : '/login'} state={{ from }} className="link">{isLogin ? 'Regístrate gratis' : 'Inicia sesión'}</Link>
          </p>
          {!isLogin && (
            <>
              <p className="mt-4 text-center text-xs text-ink-2">Gratis · Sin tarjeta · Nunca te pediremos tu frase semilla</p>
              <p className="mt-2 text-center text-xs text-ink-2">
                Al crear tu cuenta aceptas los <Link to="/terminos" className="link">Términos</Link> y el <Link to="/privacidad" className="link">Aviso de privacidad</Link>. Trace YN es educativa y no da asesoría financiera.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
