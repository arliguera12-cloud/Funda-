import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { store } from '../lib/storage';

type Theme = 'auto' | 'light' | 'dark';
const ORDER: Theme[] = ['auto', 'light', 'dark'];
const LABEL: Record<Theme, string> = { auto: 'automático', light: 'claro', dark: 'oscuro' };
const ICON = { auto: Monitor, light: Sun, dark: Moon };

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === 'auto') delete el.dataset.theme;
  else el.dataset.theme = t;
}

/** Alterna entre tema automático (el del dispositivo), claro y oscuro. */
export default function ThemeToggle({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>(() => store.get<Theme>('funda:theme', 'auto'));
  useEffect(() => apply(theme), [theme]);
  const Icon = ICON[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm ${showLabel ? '' : 'btn-icon'} ${className}`}
      onClick={() => {
        store.set('funda:theme', next);
        setTheme(next);
      }}
      aria-label={`Tema ${LABEL[theme]}. Cambiar a ${LABEL[next]}`}
      title={`Tema: ${LABEL[theme]}`}
    >
      <Icon className="size-4" aria-hidden />
      {showLabel && <span>Tema: {LABEL[theme]}</span>}
    </button>
  );
}
