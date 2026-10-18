# Funda · Aprende a invertir

App web para aprender a invertir con información, no con intuición: **bolsa y ETFs, divisas y criptomonedas** en un solo lugar, con señales explicadas, alertas, herramientas de cálculo y un tutor con IA. Pensada para principiantes de Latinoamérica (precios en dólares).

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Landing** | Portada con la tabla del día, calculadora de interés compuesto en vivo, glosario interactivo, confianza y preguntas frecuentes. |
| **Login / Registro** | Correo y contraseña + Google, con recuperación de contraseña (Firebase). Sin Firebase funciona en *versión de prueba*. |
| **Mercados** | Resumen del día (con IA o automático), termómetro de señales y tabla de todos los activos por tipo: cripto (BTC, ETH, XRP, BNB, SOL), divisas (EUR, MXN, BRL, GBP, JPY) y bolsa/ETFs (S&P 500, Nasdaq 100, bonos del Tesoro, oro). |
| **Detalle de activo** | Gráfica por periodo, datos clave, ficha educativa y señal (RSI, medias de 20 y 50 días, volatilidad) explicada en palabras simples. Las divisas se muestran sin señal. |
| **Alertas** | Avisos de precio y de cambio de señal para cualquier activo, dentro de la app y como notificación del navegador. |
| **Herramientas** | Interés compuesto (con inflación), simulador de compras periódicas (DCA) con precios reales y test de perfil de inversionista. |
| **Funda IA** (Gemini) | Tutor de inversión en general. Sin clave responde desde el glosario y las fichas, y nunca recomienda comprar o vender. |
| **Aprende** | Ruta de 5 guías para empezar, guías de seguridad y cripto, fichas de cada instrumento y glosario de +70 términos. |
| **Plataformas** | Enlaces oficiales a brokers, exchanges y billeteras, con avisos de disponibilidad por país. |

Diseño: un "diario del inversionista" en papel (tema claro, oscuro o automático), serif de titular, números en monoespaciada y filetes finos en lugar de tarjetas. Respeta `prefers-reduced-motion` y cumple contraste AA.

## Correr en tu computadora

Necesitas Node.js 20 o más reciente.

```bash
npm install
cp .env.example .env.local   # y completa las claves (opcional)
npm run dev                  # abre http://localhost:3000
```

Otros comandos: `npm run build`, `npm test`, `npm run typecheck`.

### Claves (todas opcionales)

- **Gemini**: <https://aistudio.google.com/apikey> → `GEMINI_API_KEY`.
- **Firebase Auth**: crea un proyecto en <https://console.firebase.google.com>, activa *Correo/contraseña* y *Google*, registra una app web y copia los valores en `VITE_FIREBASE_*`. Agrega tu dominio en *Authentication → Settings → Authorized domains*.
- **Bolsa y ETFs**: clave gratuita de <https://twelvedata.com> → `VITE_TWELVEDATA_KEY`. Sin ella esa sección queda desactivada.
- **Dominio público**: `VITE_SITE_URL` (por ejemplo `https://funda.app`) para que la imagen al compartir en WhatsApp/Facebook use una URL absoluta.

Sin claves la app funciona igual: cripto y divisas no necesitan clave, el login queda en versión de prueba y el asistente responde con el glosario.

## Fuentes de datos

| Datos | Fuente | Frecuencia |
|---|---|---|
| Cripto | CoinGecko (pública) | Cada minuto |
| Divisas | Banco Central Europeo vía Frankfurter | Diaria (días hábiles) |
| Bolsa y ETFs | Twelve Data (clave propia) | Cierre diario |

Todo se guarda en caché local: la app muestra al instante los últimos datos, avisa cuando son viejos y no dispara alertas con datos desactualizados.

## Migrar a Google AI Studio

El proyecto usa la misma base que generan las apps de AI Studio (Build): **React + TypeScript + Vite + `@google/genai`**, la clave en `GEMINI_API_KEY` y `metadata.json`. Sube o pega los archivos respetando la estructura y usa **Deploy** de AI Studio (Cloud Run), que mantiene la clave del lado del servidor.

> ⚠️ Si publicas `npm run build` en un hosting estático (Netlify, Vercel, GitHub Pages), la clave de Gemini y la de Twelve Data quedan visibles en el navegador (el build lo advierte). Para publicar fuera de AI Studio, mueve esas llamadas a un backend o, como mínimo, restringe las claves a tu dominio y fija un límite diario de uso.

## Estructura

```
src/
  pages/        Landing, Login, Dashboard (Mercados), AssetDetail, Alerts, Tools, Assistant, Learn, Platforms, Legal
  components/   AppLayout, PublicChrome, MarketTape, PriceChart, ThemeToggle, Toaster, ui (sistema visual)
  lib/          http (caché), market / fx / stocks (proveedores), assets (catálogo), indicators (señales),
                calc (herramientas), alerts, ai, auth, glossary-answer
  data/         Glosario, guías, fichas por activo y plataformas (contenido editable)
```

## Limitaciones actuales

- Las alertas solo se revisan mientras la app está abierta y se guardan en el navegador. Para push con la app cerrada hace falta Firebase Cloud Messaging y un backend.
- Los tipos de cambio y los precios de bolsa son de cierre diario, no en tiempo real.
- Las páginas de Términos y Privacidad son un borrador: revísalas y agrega un correo de contacto real antes de lanzar.
- Las integraciones con CoinGecko, Frankfurter y Twelve Data se probaron con respuestas simuladas, no contra las APIs reales.

---

*Funda es una herramienta educativa. Las señales se calculan automáticamente y no son asesoría financiera.*
