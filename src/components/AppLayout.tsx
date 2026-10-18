import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Bot, LayoutDashboard, LogOut, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useMarket } from '../lib/market-context';
import { AlertsProvider } from '../lib/alerts';
import { timeAgo } from '../lib/format';
import { Logo, Skeleton } from './ui';

const NAV = [
  { to: '/app', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/app/alertas', label: 'Alertas', icon: Bell },
  { to: '/app/asistente', label: 'Asistente IA', icon: Bot },
  { to: '/app/aprende', label: 'Academia', icon: BookOpen },
  { to: '/app/billeteras', label: 'Billeteras', icon: Wallet },
];

export default function AppLayout() {
  const { user, demo, signOut } = useAuth();
  const { updatedAt, error, refresh } = useMarket();
  const navigate = useNavigate();
  const initials = user!.name.slice(0, 2).toUpperCase();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-emerald-400/10 text-emerald-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <AlertsProvider uid={user!.uid}>
      <div className="min-h-screen lg:pl-64">
        {/* Sidebar (desktop) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-surface/60 p-5 lg:flex">
          <Logo to="/app" />
          <nav className="mt-10 flex flex-col gap-1" aria-label="Principal">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              {user!.photoURL ? (
                <img src={user!.photoURL} alt="" className="h-9 w-9 rounded-full" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-ink">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user!.name}</p>
                <p className="truncate text-xs text-slate-500">{user!.email}</p>
              </div>
            </div>
            <button
              className="btn btn-ghost mt-3 w-full py-2 text-xs"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-ink/80 px-4 py-3 backdrop-blur sm:px-8">
          <div className="lg:hidden">
            <Logo to="/app" />
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className={`h-2 w-2 rounded-full ${error ? 'bg-amber-400' : 'animate-pulse bg-emerald-400'}`} />
            {error ? error : updatedAt ? `Precios en vivo · actualizado ${timeAgo(updatedAt)}` : 'Conectando con el mercado…'}
          </div>
          <div className="flex items-center gap-2">
            {demo && <span className="chip hidden border-amber-400/30 text-amber-300 sm:inline-flex">Modo demo</span>}
            <button className="btn btn-ghost px-3 py-2" onClick={refresh} aria-label="Actualizar precios">
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
            <button
              className="btn btn-ghost px-3 py-2 lg:hidden"
              aria-label="Cerrar sesión"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-8 lg:pb-12">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/[0.06] bg-ink/95 backdrop-blur lg:hidden" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-emerald-300' : 'text-slate-500'}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label.replace(' IA', '')}
            </NavLink>
          ))}
        </nav>
      </div>
    </AlertsProvider>
  );
}
