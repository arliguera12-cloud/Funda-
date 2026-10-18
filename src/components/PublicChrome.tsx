import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMarket } from '../lib/market-context';
import MarketTape from './MarketTape';
import ThemeToggle from './ThemeToggle';
import { APP_NAME, Disclaimer, Logo } from './ui';

/** Cabecera de las páginas públicas: cinta de precios, logotipo y acciones. `nav` son los enlaces de sección de la landing. */
export function PublicHeader({ nav }: { nav?: ReactNode }) {
  const { user } = useAuth();
  const { assets } = useMarket();
  return (
    <header>
      <div className="bg-ink text-on-ink">
        <div className="mx-auto flex h-9 max-w-6xl items-center px-4 sm:px-6">
          <MarketTape assets={assets} className="min-w-0 flex-1" />
        </div>
      </div>
      <div className="border-b border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo size="lg" />
          {nav}
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="rule-double mt-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Logo size="lg" />
            <p className="mt-2 max-w-sm text-sm text-ink-2">Aprende a invertir: mercados, ETFs, divisas y cripto, explicados en español claro.</p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink">
            <Link to="/terminos" className="link">
              Términos
            </Link>
            <Link to="/privacidad" className="link">
              Privacidad
            </Link>
          </nav>
        </div>
        <p className="text-sm text-ink-2">
          Datos de{' '}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="link">
            CoinGecko<span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
          ,{' '}
          <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="link">
            Frankfurter / BCE<span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>{' '}
          y Twelve Data. Explicaciones con IA de Google Gemini.
        </p>
        <Disclaimer />
        <p className="font-mono text-xs text-ink-2">
          © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
