# Guía de despliegue gratuito (para la sesión de Claude que maneja el navegador)

Objetivo: publicar Funda **sin costo** con este orden: Worker (guarda las claves) → sitio en Cloudflare Pages → Firebase (login).
Cuentas: Cloudflare, Google AI Studio, Twelve Data y Firebase (todas con plan gratuito).

## Reglas para quien ejecute esto

1. **La persona dueña escribe sus contraseñas, códigos 2FA y datos de pago.** Tú navegas, haces clic y rellenas el resto.
2. **Ninguna clave se pega en un chat, un commit, un issue ni un archivo del repo.** Las claves solo van en los campos de Cloudflare ("Variables and Secrets" / "Environment variables"). Si una clave aparece por accidente en otro lugar, avisa para revocarla.
3. Si un servicio pide tarjeta o un plan de pago, **detente y pregunta**. Todo lo de aquí cabe en planes gratuitos.
4. Anota cada URL y nombre que se cree (los usarás en pasos posteriores). Confirma en voz alta antes de borrar o sobrescribir nada.

## Nombres a usar (decídelos primero con la persona dueña)

| Dato | Valor sugerido |
|---|---|
| Proyecto de Pages (define la URL del sitio) | `funda` → `https://funda.pages.dev` (si está ocupado: `funda-invierte`, etc.) |
| Worker | `funda-api` → `https://funda-api.<subdominio-de-la-cuenta>.workers.dev` |
| Repo | `arliguera12-cloud/Funda-`, rama `main` (el PR #1 debe estar mezclado antes) |

## Paso 1 · Claves

1. **Gemini**: <https://aistudio.google.com/apikey> → *Create API key* (un proyecto nuevo de Google Cloud está bien). Copia la clave solo al portapapeles.
2. **Twelve Data**: <https://twelvedata.com> → crear cuenta gratuita (*Basic*) → *API keys*. Copia la clave.
3. **Firebase**: <https://console.firebase.google.com> → *Add project* (sin Analytics) → *Build → Authentication → Get started* → activar **Correo/contraseña** y **Google** → *Project settings → Your apps → Web (</>)* → registrar app "Funda" **sin** Hosting → anotar `apiKey`, `authDomain`, `projectId`, `appId` (la config web de Firebase es pública por diseño).
4. En Google Cloud Console (proyecto de la clave de Gemini) → *APIs & Services → Quotas*: fija un tope diario bajo para *Generative Language API*, para que un abuso no agote la cuota.

## Paso 2 · Worker (carpeta `worker/` del repo)

Opción A, recomendada (se actualiza con cada `git push`):
1. Cloudflare → *Workers & Pages → Create → Import a repository* → elegir `Funda-`.
2. Nombre `funda-api`, **Root directory** `worker`, rama `main`, comando de deploy `npx wrangler deploy`, sin build command.
3. Terminado el primer deploy: *Settings → Variables and Secrets* →
   - Secret `GEMINI_API_KEY` = clave de Gemini.
   - Secret `TWELVEDATA_KEY` = clave de Twelve Data.
   - Variable `ALLOWED_ORIGINS` = `https://funda.pages.dev` (la URL real del sitio; varios separados por coma; para probar en local agrega `http://localhost:3000`).
   - Si `wrangler.toml` vuelve a pisar `ALLOWED_ORIGINS` en cada deploy, edita el valor en `worker/wrangler.toml` y súbelo al repo (es lo correcto: la variable no es secreta).
4. Anota la URL del Worker.

Opción B (sin Git): *Workers & Pages → Create → Hello World* → nombre `funda-api` → *Edit code* → pegar el contenido de `worker/index.js` → Deploy, y luego añadir los secretos y la variable como arriba.

**Prueba** (con DevTools o `curl`, desde un origen permitido el Worker responde; desde otro, 403):
- `GET <worker>/stocks?symbol=SPY&outputsize=5` con cabecera `Origin: https://funda.pages.dev` → JSON con `values`.
- Sin cabecera `Origin` → `403`.

**Límite de abuso (gratis)**: Cloudflare → el dominio/zona del Worker → *Security → WAF → Rate limiting rules* → una regla por IP (por ejemplo 30 peticiones/minuto a `funda-api…/v1beta/*`). Si la cuenta no tiene zona propia en `workers.dev`, omítelo: el tope de cuota de Gemini del Paso 1.4 es la protección.

## Paso 3 · Sitio en Cloudflare Pages

1. *Workers & Pages → Create → Pages → Connect to Git* → `Funda-`, rama `main`.
2. Build command `npm run build`, output directory `dist`, variable `NODE_VERSION` = `22`.
3. Variables de entorno (**Production**; son de compilación, así que hay que re-desplegar al cambiarlas):
   - `VITE_API_PROXY` = URL del Worker (sin barra final)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
   - `VITE_SITE_URL` = `https://funda.pages.dev` (o el dominio propio)
   - **No definas** `GEMINI_API_KEY` ni `VITE_TWELVEDATA_KEY` aquí: con el proxy no hacen falta y quedarían visibles en el navegador.
4. Guardar y desplegar. Si la URL final difiere de la sugerida, corrige `ALLOWED_ORIGINS` (Paso 2) y `VITE_SITE_URL`, y re-despliega.

## Paso 4 · Firebase

*Authentication → Settings → Authorized domains → Add domain* → `funda.pages.dev` (y el dominio propio si lo hay).

## Paso 5 · Verificación final (en la URL pública, ventana de incógnito)

- [ ] Portada y `#/app` cargan; el tema claro/oscuro cambia; sin errores rojos en consola.
- [ ] Cripto y divisas muestran precios reales (CoinGecko y Frankfurter se piden directo desde el navegador).
- [ ] Sección **Bolsa y ETFs** muestra datos (pestaña Network: la petición va al Worker `/stocks`, **no** a `api.twelvedata.com`).
- [ ] **Funda IA** responde (Network: `POST` al Worker, sin `generativelanguage.googleapis.com`; ninguna clave en las peticiones).
- [ ] Buscar en el código servido (`Sources`) las cadenas `AIza` y la clave de Twelve Data: **no deben aparecer**.
- [ ] Login con Google y con correo/contraseña funciona; cerrar sesión funciona.
- [ ] Desde otro origen (por ejemplo `curl -H "Origin: https://malo.com" <worker>/stocks?symbol=SPY&outputsize=5`) el Worker responde `403`.

## Paso 6 · Pendientes que decide la persona dueña

- Correo de contacto real en `src/pages/Legal.tsx` (Términos y Privacidad) y revisión del texto. Con el plan gratuito de Gemini, Google puede usar las conversaciones para mejorar sus modelos: mencionarlo en Privacidad.
- Dominio propio (opcional): *Pages → Custom domains*; luego actualizar `ALLOWED_ORIGINS`, `VITE_SITE_URL` y los dominios autorizados de Firebase.
- Analítica gratuita sin cookies: *Cloudflare → Web Analytics*.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| IA o bolsa dan "Origen no permitido" / error de CORS | `ALLOWED_ORIGINS` no incluye la URL exacta del sitio (con `https://`, sin barra final) |
| Bolsa aparece "desactivada" | Falta `VITE_API_PROXY` en Pages, o no se re-desplegó después de añadirla |
| Bolsa vacía con error de límite | Cupo gratis de Twelve Data (800/día); la caché del Worker lo reduce, reintenta en unos minutos |
| Login con Google: `auth/unauthorized-domain` | Falta el dominio en Firebase → Authorized domains |
| `503 IA no configurada` | Falta el secreto `GEMINI_API_KEY` en el Worker |
