import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, LayoutDashboard, LogOut, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { STALE_MS, useMarket, useNow } from '../lib/market-context';
import { AlertsProvider } from '../lib/alerts';
import { markStep } from '../lib/onboarding';
import { timeAgo } from '../lib/format';
import { Disclaimer, Logo, Skeleton } from './ui';
import ErrorBoundary from './ErrorBoundary';

const NAV = [
  { to: '/app', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/app/alertas', label: 'Alertas', icon: Bell },
  { to: '/app/asistente', label: 'Funda IA', icon: Sparkles },
  { to: '/app/aprende', label: 'Academia', icon: BookOpen },
  { to: '/app/billeteras', label: 'Billeteras', icon: Wallet },
];

function MarketStatus() {
  const { updatedAt, error, refreshing } = useMarket();
  const now = useNow();
  const stale = updatedAt != null && now - updatedAt > STALE_MS;
  const offline = !!error && !updatedAt;
  const text = offline
    ? 'Sin conexión con el mercado'
    : stale
      ? `Datos de ${timeAgo(updatedAt!)} · sin conexión con el mercado`
      : updatedAt
        ? `Precios en vivo · ${refreshing ? 'actualizando…' : `actualizado ${timeAgo(updatedAt)}`}`
        : 'Conectando con el mercado…';
  const warn = offline || stale;
  return (
    <p className="flex min-w-0 items-center gap-2 text-xs text-slate-400" role={warn ? 'alert' : 'status'}>
      {/* Pings once per refresh instead of pulsing forever */}
      <span key={updatedAt ?? 0} className="relative flex size-2 shrink-0">
        {!warn && updatedAt && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 [animation-iteration-count:1]" />}
        <span className={`relative size-2 rounded-full ${warn ? 'bg-amber-300' : updatedAt ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      </span>
      <span className="hidden truncate sm:inline">{text}</span>
      <span className="truncate sm:hidden">{offline ? 'Sin conexión' : stale ? `Datos de ${timeAgo(updatedAt!)}` : updatedAt ? 'En vivo' : 'Conectando…'}</span>
    </p>
  );
}

function RefreshButton() {
  const { refresh } = useMarket();
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const onClick = async () => {
    const t = performance.now();
    setSpinning(true);
    setDone(false);
    await refresh(true);
    // A minimum spin reads as completed work rather than a glitch
    setTimeout(() => {
      setSpinning(false);
      setDone(true);
    }, Math.max(0, 600 - (performance.now() - t)));
  };
  return (
    <>
      <button className="btn btn-ghost btn-icon" onClick={onClick} disabled={spinning} aria-busy={spinning} aria-label="Actualizar precios" title="Actualizar precios">
        <RefreshCw className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden />
      </button>
      <span role="status" className="sr-only">
        {done ? 'Precios actualizados' : ''}
      </span>
    </>
  );
}

export default function AppLayout() {
  const { user, demo, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const firstRender = useRef(true);
  const u = user!;
  const initials = u.name.trim().slice(0, 2).toUpperCase() || '?';

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  // New page: start at the top, move focus to the content for keyboard/screen-reader users, close menus
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // First-steps progress for the Dashboard checklist
  useEffect(() => {
    if (pathname.startsWith('/app/cripto/')) markStep(u.uid, 'coin');
    if (pathname === '/app/aprende' && new URLSearchParams(search).get('tab') === 'guias') markStep(u.uid, 'guide');
  }, [pathname, search, u.uid]);

  // Close the account menu on outside click
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const m = menuRef.current;
      if (m?.open && !m.contains(e.target as Node)) m.open = false;
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // Warm up the other pages so navigation never shows a loading flash
  useEffect(() => {
    const t = setTimeout(() => {
      import('../pages/Dashboard');
      import('../pages/CoinDetail');
      import('../pages/Alerts');
      import('../pages/Assistant');
      import('../pages/Learn');
      import('../pages/Platforms');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const avatar = u.photoURL ? (
    <img src={u.photoURL} alt="" className="size-9 rounded-full" referrerPolicy="no-referrer" />
  ) : (
    <span className="grid size-9 place-items-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-200 ring-1 ring-emerald-400/30">{initials}</span>
  );

  return (
    <AlertsProvider uid={u.uid}>
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Saltar al contenido
      </button>
      <div className="min-h-dvh lg:pl-64">
        {/* Sidebar (desktop) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-surface/60 p-5 lg:flex">
          <Logo to="/app" />
          <nav className="mt-10 flex flex-col gap-1" aria-label="Principal">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] active:scale-[0.98] ${
                    isActive ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/15' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="card mt-auto p-4">
            <div className="flex items-center gap-3">
              {avatar}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                <p className="truncate text-xs text-slate-400">{u.email}</p>
              </div>
            </div>
            {demo && (
              <p className="mt-3 text-xs text-amber-200/90" title="Tus datos se guardan solo en este navegador">
                Versión de prueba: tus datos se guardan solo en este navegador.
              </p>
            )}
            <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Top bar */}
        <header className="glass sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-8 [@media(max-height:30rem)]:static">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Logo to="/app" />
            </div>
            <MarketStatus />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {demo && (
              <span className="chip hidden border-amber-300/30 text-amber-200 sm:inline-flex" title="Tus datos se guardan solo en este navegador">
                Versión de prueba
              </span>
            )}
            <RefreshButton />
            {/* Account menu (mobile) */}
            <details ref={menuRef} className="relative lg:hidden">
              <summary className="grid size-11 cursor-pointer place-items-center rounded-full" aria-label="Tu cuenta">
                {avatar}
              </summary>
              <div className="card absolute right-0 mt-2 w-64 animate-fade-up p-3 shadow-2xl shadow-black/60" style={{ '--rise': '-4px' } as CSSProperties}>
                <p className="truncate px-1 text-sm font-semibold text-white">{u.name}</p>
                <p className="truncate px-1 text-xs text-slate-400">{u.email}</p>
                {demo && <p className="mt-2 px-1 text-xs text-amber-200/90">Versión de prueba: tus datos se guardan solo en este navegador.</p>}
                <button className="btn btn-ghost mt-3 w-full text-rose-200" onClick={logout}>
                  <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
                </button>
              </div>
            </details>
          </div>
        </header>

        <main
          id="contenido"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto max-w-6xl px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] outline-none sm:px-8 lg:pt-8 lg:pb-12"
        >
          <Suspense
            fallback={
              <div className="animate-fade-in space-y-8 [animation-delay:400ms]" role="status">
                <span className="sr-only">Cargando…</span>
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-64" />
              </div>
            }
          >
            <ErrorBoundary key={pathname}>
              <div className="animate-fade-up" style={{ '--rise': '6px' } as CSSProperties}>
                <Outlet />
              </div>
            </ErrorBoundary>
          </Suspense>
          <Disclaimer className="mt-16 border-t border-white/[0.06] pt-6" />
        </main>

        {/* Bottom nav (mobile) */}
        <nav
          className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)] lg:hidden [@media(max-height:30rem)]:static"
          aria-label="Principal"
        >
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `group flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-12 place-items-center rounded-full transition-[background-color,transform] duration-200 group-active:scale-90 ${
                      isActive ? 'bg-emerald-400/15' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </AlertsProvider>
  );
}
