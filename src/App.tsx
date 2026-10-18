import { lazy, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { MarketProvider } from './lib/market-context';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
// App pages load on demand so the landing stays light
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Learn = lazy(() => import('./pages/Learn'));
const Platforms = lazy(() => import('./pages/Platforms'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-400">Cargando…</div>;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        {/* HashRouter: works on any static host and inside AI Studio's preview */}
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login mode="login" />} />
            <Route path="/registro" element={<Login mode="register" />} />
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
  );
}
