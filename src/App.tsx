import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { MarketProvider } from './lib/market-context';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';

// App pages load on demand so the landing stays light
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Learn = lazy(() => import('./pages/Learn'));
const Platforms = lazy(() => import('./pages/Platforms'));
const Legal = lazy(() => import('./pages/Legal'));

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <span className="flex items-center gap-3 text-sm text-slate-400">
        <LoaderCircle className="size-5 animate-spin text-emerald-300" aria-hidden />
        Cargando…
      </span>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

// Public pages start at the top (AppLayout handles this for the app itself)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/app')) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketProvider>
          {/* HashRouter: works on any static host and inside AI Studio's preview */}
          <HashRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login mode="login" />} />
              <Route path="/registro" element={<Login mode="register" />} />
              <Route
                path="/terminos"
                element={
                  <Suspense fallback={<FullScreenLoader />}>
                    <Legal kind="terminos" />
                  </Suspense>
                }
              />
              <Route
                path="/privacidad"
                element={
                  <Suspense fallback={<FullScreenLoader />}>
                    <Legal kind="privacidad" />
                  </Suspense>
                }
              />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="cripto/:id" element={<CoinDetail />} />
                <Route path="alertas" element={<Alerts />} />
                <Route path="asistente" element={<Assistant />} />
                <Route path="aprende" element={<Learn />} />
                <Route path="billeteras" element={<Platforms />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </MarketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
