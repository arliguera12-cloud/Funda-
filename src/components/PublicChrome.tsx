import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { APP_NAME, Disclaimer, Logo } from './ui';

/** Header for public pages (landing, legal). `nav` holds in-page section links on the landing. */
export function PublicHeader({ nav }: { nav?: ReactNode }) {
  const { user } = useAuth();
  return (
    <header className="glass sticky top-0 z-30 border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        {nav}
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/app" className="btn btn-primary">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost px-3 sm:px-4">
                <span className="sm:hidden">Entrar</span>
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
              <Link to="/registro" className="btn btn-primary px-3 sm:px-4">
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <Logo />
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <Link to="/terminos" className="hover:text-white">
              Términos
            </Link>
            <Link to="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
          </nav>
        </div>
        <p className="text-sm text-slate-400">
          Datos de precios por{' '}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="link">
            CoinGecko<span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>{' '}
          · Explicaciones con IA de Google Gemini
        </p>
        <Disclaimer />
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
