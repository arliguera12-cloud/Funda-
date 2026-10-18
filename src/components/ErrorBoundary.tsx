import { Component, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

const CHUNK_ERROR = /dynamically imported module|Loading chunk|Importing a module script failed/i;
const RELOADED = 'funda:reloaded';

/** Evita una pantalla en blanco si falla un render (o un bloque obsoleto tras una publicación). */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
    // Una pestaña abierta durante una publicación pide bloques que ya no existen: recarga una vez para traer la versión nueva
    try {
      if (CHUNK_ERROR.test(error.message) && !sessionStorage.getItem(RELOADED)) {
        sessionStorage.setItem(RELOADED, '1');
        location.reload();
      }
    } catch {
      /* almacenamiento bloqueado: mostramos el mensaje */
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="panel-hard max-w-md p-8 text-center shadow-[4px_4px_0_0_var(--ink)]" role="alert">
          <span className="mx-auto grid size-14 place-items-center rounded-[4px] border border-ink bg-mark text-[#17140f]">
            <TriangleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl">Algo salió mal</h1>
          <p className="mt-2 text-ink-2">Tuvimos un problema al mostrar esta pantalla. Recarga la página para continuar.</p>
          <button className="btn btn-primary mt-6" onClick={() => location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Recargar
          </button>
        </div>
      </div>
    );
  }
}
