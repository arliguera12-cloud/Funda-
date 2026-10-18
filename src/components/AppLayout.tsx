import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Calculator, ChartLine, LogOut, RefreshCw, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { STALE_MS, useMarket, useNow } from '../lib/market-context';
import { AlertsProvider } from '../lib/alerts';
import { markStep } from '../lib/onboarding';
import { timeAgo } from '../lib/format';
import ErrorBoundary from './ErrorBoundary';
import MarketTape from './MarketTape';
import ThemeToggle from './ThemeToggle';
import { Disclaimer, Logo, Skeleton } from './ui';

const NAV = [
  { to: '/app', label: 'Mercados', icon: ChartLine, end: true },
  { to: '/app/alertas', label: 'Alertas', icon: Bell },
  { to: '/app/herramientas', label: 'Herramientas', icon: Calculator },
  { to: '/app/aprende', label: 'Aprende', icon: BookOpen },
  { to: '/app/asistente', label: 'Funda IA', icon: Sparkles },
  { to: '/app/plataformas', label: 'Plataformas', icon: Store, desktopOnly: true },
];

function MarketStatus() {
  const { updatedAt, error, refreshing } = useMarket();
  const now = useNow();
  const stale = updatedAt != null && now - updatedAt > STALE_MS;
  const offline = !!error && !updatedAt;
  const long = offline
    ? 'Sin conexión con el mercado'
    : stale
      ? `Datos de ${timeAgo(updatedAt!)} · sin conexión`
      : updatedAt
        ? `En vivo · ${refreshing ? 'actualizando…' : timeAgo(updatedAt)}`
        : 'Conectando…';
  const short = offline ? 'Sin conexión' : stale ? timeAgo(updatedAt!) : updatedAt ? 'En vivo' : 'Conectando…';
  const warn = offline || stale;
  return (
    <p className="num flex shrink-0 items-center gap-2 text-xs" role={warn ? 'alert' : 'status'}>
      {/* Hace un solo "ping" por actualización en vez de parpadear para siempre */}
      <span key={updatedAt ?? 0} className="relative flex size-2 shrink-0">
        {!warn && updatedAt && <span className="absolute inset-0 animate-ping rounded-full bg-up-inv [animation-iteration-count:1]" />}
        <span className={`relative size-2 rounded-full ${warn ? 'bg-mark' : updatedAt ? 'bg-up-inv' : 'bg-on-ink/50'}`} />
      </span>
      <span className="hidden sm:inline">{long}</span>
      <span className="sm:hidden">{short}</span>
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
    // Un giro mínimo se lee como trabajo hecho y no como un fallo
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
  const { assets } = useMarket();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const firstRender = useRef(true);
  const u = user!;
  const initials = u.name.trim().slice(0, 2).toUpperCase() || '?';
  const today = new Date().toLocaleDateString('es-419', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  // Página nueva: arranca arriba, enfoca el contenido (teclado y lectores de pantalla) y cierra el menú
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // Avance de los primeros pasos del panel
  useEffect(() => {
    if (pathname.startsWith('/app/mercado/')) markStep(u.uid, 'asset');
    if (pathname === '/app/herramientas') markStep(u.uid, 'tool');
  }, [pathname, u.uid]);

  // Cerrar el menú de cuenta al hacer clic fuera
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const m = menuRef.current;
      if (m?.open && !m.contains(e.target as Node)) m.open = false;
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // Precarga las demás páginas en reposo para que navegar no muestre un parpadeo (no con Save-Data ni 2G)
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData || /2g/.test(c?.effectiveType ?? '')) return;
    const warm = () => {
      import('../pages/Dashboard');
      import('../pages/AssetDetail');
      import('../components/PriceChart');
      import('../pages/Alerts');
      import('../pages/Tools');
      import('../pages/Assistant');
      import('../pages/Learn');
      import('../pages/Platforms');
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AlertsProvider uid={u.uid}>
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Saltar al contenido
      </button>
      <div className="min-h-dvh">
        {/* Cinta de precios + estado */}
        <div className="bg-ink text-on-ink">
          <div className="mx-auto flex h-9 max-w-6xl items-center gap-5 px-4 sm:px-8">
            <MarketTape assets={assets} className="min-w-0 flex-1" />
            <MarketStatus />
          </div>
        </div>

        {/* Cabecera del diario */}
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 pt-4 pb-3 sm:px-8">
          <div className="min-w-0">
            <Logo size="lg" to="/app" />
            <p className="kicker mt-1.5 hidden first-letter:uppercase sm:block">{today}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RefreshButton />
            <details ref={menuRef} className="relative">
              <summary className="grid size-11 cursor-pointer place-items-center rounded-[5px] border border-ink bg-paper font-mono text-sm font-semibold text-ink transition-colors hover:bg-paper-3" aria-label="Tu cuenta">
                {u.photoURL ? <img src={u.photoURL} alt="" className="size-full rounded-[4px] object-cover" referrerPolicy="no-referrer" /> : initials}
              </summary>
              <div className="panel-hard absolute right-0 z-40 mt-2 w-72 animate-fade-up p-4 shadow-[4px_4px_0_0_var(--ink)]" style={{ '--rise': '-4px' } as CSSProperties}>
                <p className="truncate font-display text-lg font-semibold text-ink">{u.name}</p>
                <p className="truncate text-sm text-ink-2">{u.email}</p>
                {demo && <p className="mt-2 text-xs text-warn">Versión de prueba: tus datos se guardan solo en este navegador.</p>}
                <div className="hairline mt-3 grid gap-2 pt-3">
                  <Link to="/app/plataformas" className="btn btn-ghost btn-sm justify-start">
                    <Store className="size-4" aria-hidden /> Plataformas
                  </Link>
                  <ThemeToggle showLabel className="justify-start" />
                  <button className="btn btn-ghost btn-sm justify-start" onClick={logout}>
                    <LogOut className="size-4" aria-hidden /> Cerrar sesión
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Secciones (escritorio) */}
        <nav className="sticky top-0 z-30 hidden border-y border-ink bg-paper/95 backdrop-blur lg:block" aria-label="Principal">
          <ul className="mx-auto flex max-w-6xl gap-1 px-8">
            {NAV.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `-mb-px block border-b-[3px] px-3 py-3 text-sm font-semibold transition-colors ${isActive ? 'border-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-b border-ink lg:hidden" />

        <main
          id="contenido"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto max-w-6xl px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] outline-none sm:px-8 lg:pb-14"
        >
          <Suspense
            fallback={
              <div className="animate-fade-in space-y-8 [animation-delay:400ms]" role="status">
                <span className="sr-only">Cargando…</span>
                <Skeleton className="h-12 w-72" />
                <Skeleton className="h-64" />
              </div>
            }
          >
            <ErrorBoundary key={pathname}>
              <div className="animate-rise" style={{ '--rise': '6px' } as CSSProperties}>
                <Outlet />
              </div>
            </ErrorBoundary>
          </Suspense>
          <Disclaimer className="hairline mt-16 pt-6" />
        </main>

        {/* Navegación inferior (móvil) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden [@media(max-height:30rem)]:static"
          aria-label="Principal"
        >
          {NAV.filter((n) => !n.desktopOnly).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold transition-colors ${isActive ? 'text-ink' : 'text-ink-2'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span aria-hidden className={`absolute inset-x-3 top-0 h-[3px] transition-colors ${isActive ? 'bg-ink' : 'bg-transparent'}`} />
                  <Icon className="size-5" aria-hidden />
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
