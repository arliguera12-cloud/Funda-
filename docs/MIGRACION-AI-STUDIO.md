# Guía de migración a Google AI Studio (para la sesión de Claude que maneja el navegador)

Objetivo: tener Trace YN también dentro de **Google AI Studio (Build)** y desplegado en **Cloud Run** desde ahí, **sin apagar** el sitio actual de Cloudflare (`https://traceyn.pages.dev`) hasta que el nuevo esté probado.

Estado de partida:
- Es una app React + TypeScript + Vite que usa `@google/genai`, igual que las apps de AI Studio. Tiene `metadata.json`, usa rutas con `#` (funcionan dentro de la vista previa) y lee la clave de Gemini de `process.env.GEMINI_API_KEY`.
- Hoy Gemini y Twelve Data (bolsa) pasan por el Worker de Cloudflare `funda-api`, que guarda las claves. Cripto (CoinGecko) y divisas (Frankfurter) se piden directo desde el navegador y no tienen clave.
- Login con Firebase Auth (proyecto `funda-d71ec`, sus valores públicos están en las variables `VITE_FIREBASE_*`).

## Reglas para quien ejecute esto

1. **La persona dueña escribe sus contraseñas, códigos 2FA y datos de pago.** Tú navegas, haces clic y rellenas el resto.
2. **Ninguna clave se pega en un chat, un commit, un issue ni un archivo del repo.** Solo en los paneles de Secrets o variables de cada servicio. Si una clave aparece por accidente en otro lugar, avisa para revocarla.
3. **Cloud Run puede pedir facturación activada** (aunque la capa gratuita cubre un uso bajo). Si aparece una tarjeta o un plan de pago, **detente y pregunta**. Confirma también antes de borrar o sobrescribir nada.
4. Anota cada URL que se cree (vista previa, Cloud Run): se usan en los pasos 5, 6 y 7.

## Dónde vive cada pieza

| Pieza | Después de migrar |
|---|---|
| Sitio (frontend) | AI Studio → Cloud Run (nuevo). Cloudflare Pages sigue vivo como respaldo |
| Gemini (Funda IA, resumen del día) | Secreto `GEMINI_API_KEY` de AI Studio (opción A) o el Worker (opción B, ver paso 4) |
| Bolsa y ETFs (Twelve Data) | Sigue en el Worker de Cloudflare (`VITE_API_PROXY`): AI Studio no tiene dónde guardar esa clave de forma segura para el navegador |
| Cripto y divisas | Directo desde el navegador, sin cambios |
| Login | Firebase, agregando los dominios nuevos |

## Paso 1 · Preparar el código (ya está hecho; solo comprobar)

1. Repo: `arliguera12-cloud/Funda-`, rama `main`.
2. `npm ci && npm run build` termina sin errores y existen `metadata.json` (nombre y descripción de la app) y `package.json` con `dev`, `build` y `preview`.
3. Para subir un ZIP (si no se puede importar desde GitHub): en GitHub → *Code → Download ZIP* de `main`. Las carpetas `worker/`, `.github/` y `docs/` no hacen falta en AI Studio; no estorban.

## Paso 2 · Importar el proyecto a AI Studio

1. Entrar a <https://aistudio.google.com/apps> con la cuenta de Google del dueño → **Build**.
2. Buscar la opción de **importar desde GitHub** (o *Upload / Import project* si no existe) y elegir el repo `Funda-`, rama `main`. Si la importación desde GitHub no está disponible o falla con repos privados, usar el ZIP del paso 1.
3. Si AI Studio pide elegir plantilla o framework, elegir **React + Vite** (la que usa TypeScript).
4. Si el editor muestra su propio `package.json`, `vite.config.ts` o `metadata.json`, **conservar los del repo**. Es lo que ya funciona con `npm run build`.
5. Esperar a que arranque la vista previa y anotar su URL.

## Paso 3 · Secreto de Gemini

1. En AI Studio abrir el panel **Secrets** (o *Settings → Secrets*).
2. Si la app ya tiene `GEMINI_API_KEY` creada automáticamente, déjala. Si no, créala: nombre `GEMINI_API_KEY`, valor = una clave de <https://aistudio.google.com/apikey> (la persona dueña la copia al portapapeles y la pega).
3. Opcional: `GEMINI_MODEL`, solo si quieren otro modelo (por defecto `gemini-flash-latest`).

## Paso 4 · Probar en la vista previa y decidir la opción de Gemini

Con la sesión iniciada (o en modo demo), comprobar:

- [ ] La landing y `#/app` cargan, sin errores rojos en la consola.
- [ ] Cripto y divisas muestran precios reales.
- [ ] **Funda IA** (`#/app/asistente`) responde con IA (la etiqueta debe decir "Tutor con IA", no "Respuestas del glosario").
- [ ] El "Resumen del día" de Mercados aparece sin el aviso de IA desactivada.

**Si la IA funciona → opción A: listo, no hay nada que cambiar** (la clave nunca viaja al navegador).

**Si la IA aparece desactivada o falla → opción B (usar el Worker para Gemini):**
1. En el repo crear `.env.production` con SOLO valores públicos (nunca claves):
   ```
   VITE_API_PROXY=https://funda-api.nahum-mpc.workers.dev
   ```
   (`.env.production` no está en `.gitignore`; Vite lo lee solo al compilar.) Sube el cambio por PR y vuelve a importar o sincronizar el proyecto.
2. En Cloudflare → Workers & Pages → `funda-api` → Settings → Variables: agregar el origen de la vista previa (y luego el de Cloud Run) a `ALLOWED_ORIGINS`, separados por coma, sin barra final. Si el Worker se despliega desde `worker/wrangler.toml`, edita el valor allá y súbelo al repo.
3. Repetir la prueba. El Worker solo permite el modelo `gemini-flash-latest`, así que no cambies `GEMINI_MODEL` en esta opción.

**Bolsa y ETFs** necesita siempre `VITE_API_PROXY` (la clave de Twelve Data vive en el Worker). Si en la prueba la sección dice "datos desactivados", haz el paso 1 de la opción B aunque Gemini ya funcione, y agrega el origen a `ALLOWED_ORIGINS`.

## Paso 5 · Firebase (login)

1. <https://console.firebase.google.com> → proyecto `funda-d71ec` → *Authentication → Settings → Authorized domains → Add domain*.
2. Agregar el dominio de la vista previa de AI Studio y, cuando exista, el de Cloud Run (solo el host, sin `https://`).
3. Si los valores `VITE_FIREBASE_*` no se pueden definir en AI Studio, ponerlos también en `.env.production` (son públicos por diseño; el repo ya los usa así en Cloudflare). Sin ellos el login funciona en modo demo.
4. Probar crear cuenta, iniciar sesión con correo, con Google y cerrar sesión. Para Google, si abre una ventana emergente bloqueada, probar de nuevo fuera del iframe de la vista previa (abrir la URL en una pestaña nueva).

## Paso 6 · Desplegar en Cloud Run desde AI Studio

1. En AI Studio → botón **Deploy** (Cloud Run). Elegir o crear un proyecto de Google Cloud.
2. **Si pide activar facturación, detente y pregunta a la persona dueña.** La capa gratuita de Cloud Run alcanza para un uso bajo, pero necesita una cuenta de facturación.
3. Anotar la URL del servicio (`https://<servicio>-<id>.<región>.run.app`).
4. Poner topes de gasto, porque la clave del dueño paga el uso de todos los visitantes:
   - Google Cloud → *Cloud Run → servicio → Edit → Autoscaling*: máximo de instancias bajo (por ejemplo 2 o 3).
   - Google Cloud → *Billing → Budgets & alerts*: crear un presupuesto con alertas de correo.
   - Google Cloud → *APIs & Services → Quotas*: tope diario bajo para *Generative Language API*.

## Paso 7 · Cerrar la configuración con la URL de Cloud Run

- [ ] Firebase: dominio de Cloud Run autorizado (paso 5).
- [ ] Si usas el Worker (opción B o Bolsa): origen de Cloud Run en `ALLOWED_ORIGINS` (paso 4).
- [ ] `VITE_SITE_URL`: déjalo apuntando al sitio que vaya a ser el oficial. Mientras Cloudflare siga siendo el principal, **no lo cambies** (afecta el enlace canónico y la imagen al compartir).
- [ ] Los encabezados de seguridad de `public/_headers` solo los aplica Cloudflare. En Cloud Run no se aplican; es una pérdida menor, pero anótalo.

## Paso 8 · Verificación final (en la URL de Cloud Run, ventana de incógnito)

- [ ] Landing y app cargan; el tema claro y oscuro cambian; sin errores en consola.
- [ ] Cripto, divisas y bolsa muestran datos (bolsa solo si el Worker acepta el origen).
- [ ] Funda IA responde con IA y el resumen del día aparece.
- [ ] En las peticiones de red (DevTools → Network) no aparece ninguna clave; buscar `AIza` en los archivos servidos: **no debe aparecer** (si aparece, la clave de Gemini está en el navegador: pasa a la opción B y revoca esa clave).
- [ ] Login con Google y con correo funciona; cerrar sesión funciona.
- [ ] Recargar una ruta interna (`/#/app/mercado/bitcoin`) abre la misma pantalla.

## Paso 9 · Decidir cuál es el sitio oficial

Decide la persona dueña, con esto delante:
- **Cloudflare Pages**: gratis, sin tope de ancho de banda, con encabezados de seguridad y despliegue automático desde `main`.
- **AI Studio / Cloud Run**: la clave de Gemini queda del lado del servidor de forma nativa y se edita con la IA de AI Studio, pero el costo cae en la cuenta de Google del dueño y requiere facturación activa.

Hasta que decida, ambos conviven. No cambiar el DNS ni el dominio propio sin su confirmación.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| La IA responde solo con el glosario | `GEMINI_API_KEY` no llega al navegador: pasar a la opción B (paso 4) |
| Bolsa dice "datos desactivados" | Falta `VITE_API_PROXY` (se necesita siempre) |
| IA o bolsa dan error de CORS / "Origen no permitido" | El origen de AI Studio/Cloud Run no está en `ALLOWED_ORIGINS` del Worker (con `https://`, sin barra final) |
| Login con Google: `auth/unauthorized-domain` | Falta el dominio en Firebase → Authorized domains |
| Pantalla en blanco al cargar | Error de compilación en AI Studio: abrir la consola del editor; verificar que usa el `package.json` del repo |
| Cripto o divisas no cargan en la vista previa | Límite de CoinGecko o política de red de la vista previa: reintentar y probar en Cloud Run |
| `429 Demasiadas preguntas seguidas` | Límite por IP del Worker (opción B): esperar un minuto |

## Qué decide la persona dueña

- Activar facturación en Google Cloud (paso 6).
- Cuál sitio será el oficial y si se compra un dominio propio (paso 9).
- Mantener el modelo `gemini-flash-latest` o cambiarlo (solo con la opción A).
