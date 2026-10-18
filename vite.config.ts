import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Same env convention as Google AI Studio apps: GEMINI_API_KEY in .env.local
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 3000, host: '0.0.0.0' },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL ?? ''),
    },
  };
});
