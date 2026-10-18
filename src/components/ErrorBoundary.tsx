import { Component, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

const CHUNK_ERROR = /dynamically imported module|Loading chunk|Importing a module script failed/i;
const RELOADED = 'funda:reloaded';

/** Keeps a render crash (or a stale chunk after a deploy) from leaving a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
    // A tab left open across a deploy asks for chunks that no longer exist: reload once to get the new build
    try {
      if (CHUNK_ERROR.test(error.message) && !sessionStorage.getItem(RELOADED)) {
        sessionStorage.setItem(RELOADED, '1');
        location.reload();
      }
    } catch {
      /* storage blocked: show the fallback */
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="card max-w-md p-8 text-center" role="alert">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-300/10 text-amber-300">
            <TriangleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-xl font-bold">Algo salió mal</h1>
          <p className="mt-2 text-sm text-slate-400">Tuvimos un problema al mostrar esta pantalla. Recarga la página para continuar.</p>
          <button className="btn btn-primary mt-6" onClick={() => location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Recargar
          </button>
        </div>
      </div>
    );
  }
}
