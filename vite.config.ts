import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Same env convention as Google AI Studio apps: GEMINI_API_KEY in .env.local
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  if (command === 'build' && env.GEMINI_API_KEY) {
    console.warn(
      '\n⚠️  GEMINI_API_KEY quedará visible en el código del navegador. Publica con AI Studio (Cloud Run) o restringe la clave ' +
        'por dominio y cuota en Google Cloud Console antes de subir este build a un hosting público.\n',
    );
  }
  return {
    // Relative base + HashRouter: the build works from any folder (GitHub Pages, AI Studio, a sub-path)
    base: './',
    plugins: [react(), tailwindcss()],
    server: { port: 3000, host: '0.0.0.0' },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL ?? ''),
    },
  };
});
