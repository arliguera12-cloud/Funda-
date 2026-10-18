# Funda · Guía de inversiones y cripto

App web para aprender a invertir en criptomonedas con información, no con intuición.

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Landing** | Página de presentación con precios en vivo, funciones, cómo funciona, preguntas frecuentes y llamados a registrarse. |
| **Login / Registro** | Correo y contraseña + Google, con recuperación de contraseña (Firebase). Sin Firebase funciona en *modo demo*. |
| **Panel** | Las 5 criptos principales (BTC, ETH, XRP, BNB, SOL) con precio, mini-gráfica, señal y tabla de estadísticas. Resumen del mercado generado con IA. |
| **Detalle de cada cripto** | Gráfica de 24 h / 7 d / 30 d / 90 d / 1 año, estadísticas, señal explicada y ficha educativa. |
| **Señales automáticas** | RSI, medias móviles de 20 y 50 días y volatilidad, combinadas en *Momento favorable / Neutral / Precaución*. |
| **Alertas** | Avisos de precio y de cambio de señal: aparecen dentro de la app y como notificación del navegador. |
| **Asistente IA (Gemini)** | Chatbot que explica términos complicados y conoce los precios y señales del momento. Sin API key responde con el glosario. |
| **Academia** | Fichas de 6 criptos, glosario de +45 términos con buscador (blockchain, tokenizar, staking, DCA, etc.) y guías paso a paso. |
| **Billeteras y exchanges** | Enlaces oficiales a Binance, Coinbase, Kraken, Bitso, OKX, Bybit, MetaMask, Trust Wallet, Phantom, Exodus, Ledger y Trezor. |

Todo se actualiza solo: los precios cada 60 s, las señales al cambiar el precio y las alertas en cada actualización.

## Correr en tu computadora

Necesitas Node.js 20 o más reciente.

```bash
npm install
cp .env.example .env.local   # y completa las claves (opcional)
npm run dev                  # abre http://localhost:3000
```

Otros comandos: `npm run build` (versión de producción), `npm test` (pruebas), `npm run typecheck`.

### Claves (opcionales)

- **Gemini**: crea una clave en <https://aistudio.google.com/apikey> y ponla en `GEMINI_API_KEY`.
- **Firebase Auth**: en <https://console.firebase.google.com> crea un proyecto, activa *Authentication → Correo/contraseña* y *Google*, registra una app web y copia los valores en las variables `VITE_FIREBASE_*`. Agrega tu dominio en *Authentication → Settings → Authorized domains*.

- **Dominio público** (opcional): pon tu dominio en `VITE_SITE_URL` (por ejemplo `https://funda.app`) para que la imagen al compartir en WhatsApp o Facebook use una URL absoluta.

Sin claves la app funciona igual: el login queda en *versión de prueba* y el asistente responde con el glosario.

## Migrar a Google AI Studio

El proyecto usa la misma base que generan las apps de AI Studio (Build): **React + TypeScript + Vite + `@google/genai`**, la clave en `GEMINI_API_KEY` y el archivo `metadata.json`. Para migrar:

1. Crea una app nueva en AI Studio (Build) y sube o pega los archivos de este repositorio respetando la estructura de carpetas.
2. AI Studio inyecta tu clave de Gemini automáticamente, así que no hace falta `.env.local` ahí.
3. Para publicar, usa **Deploy** de AI Studio (Cloud Run): mantiene la clave del lado del servidor.

> ⚠️ **Importante:** si publicas `npm run build` en un hosting estático (Netlify, Vercel, GitHub Pages), la clave de Gemini queda visible en el código del navegador (el build lo advierte). Para publicar fuera de AI Studio, mueve las llamadas a Gemini a un backend (por ejemplo, una Cloud Function) o, como mínimo, restringe la clave en Google Cloud Console a tu dominio y a la API de Gemini, con un límite diario de uso.

## Estructura

```
src/
  pages/        Landing, Login, Dashboard, CoinDetail, Alerts, Assistant, Learn, Platforms
  components/   Layout de la app, gráfica de precios y piezas de interfaz
  lib/          market (CoinGecko + caché), indicators (señales), alerts, ai (Gemini), auth (Firebase)
  data/         Glosario, fichas de criptos, guías y plataformas (contenido editable)
```

Para cambiar textos educativos, términos o plataformas solo edita los archivos de `src/data/`.

## Limitaciones actuales

- Las alertas solo se revisan mientras la app está abierta en alguna pestaña. Para notificaciones push con la app cerrada hace falta Firebase Cloud Messaging y un backend.
- Las alertas y preferencias se guardan en el navegador, no en la nube.
- Los precios vienen de la API pública gratuita de CoinGecko, que tiene un límite de consultas. La app guarda los datos en caché, muestra al instante los últimos precios guardados y avisa cuando los datos tienen más de 5 minutos.
- Las páginas de Términos y Privacidad son un borrador: revísalas antes de lanzar y agrega un correo de contacto real.

---

*Funda es una herramienta educativa. Las señales se calculan automáticamente y no son asesoría financiera.*
