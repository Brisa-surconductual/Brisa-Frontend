# ADR-0006 — Manifest y service worker de la PWA con vite-plugin-pwa

**Estado:** Propuesta
**Fecha:** 2026-11-21
**Tarea de origen:** FE-PWA-01 · infraestructura (sin RF propio, ver A-067)
**Decidió:** Samuel, responsable de la tarea
**Afecta a:** `vite.config.js`, `index.html`, `public/`, `src/main.jsx`, `src/App.jsx`,
`src/app/pwa/`, piezas de instalación de `src/features/users/` (ADR-0001)

## Contexto

Brisa se especifica como PWA instalable (SDD §3.2, C-PWA-1 a C-PWA-5), pero el repositorio
solo tenía la parte visible de la instalación (ADR-0001): el botón «Instalar Brisa», la hoja
de instrucciones por plataforma y los íconos. **No había manifiesto ni service worker.** En
consecuencia:

- Chrome, Edge, Opera y Samsung Internet nunca lanzan `beforeinstallprompt`, así que no
  aparece el aviso nativo de instalación.
- La app «instalada» se abre en `minimal-ui` y no en una ventana propia (`standalone`).
- La hoja pedía «Crear acceso directo» en lugar de «Instalar».

Hay además dos restricciones vigentes:

- **ADR-0005:** la app no funciona sin conexión. El service worker no debe crear una
  experiencia offline ni guardar datos.
- **C-PWA-2 y C-PRI-1:** los datos de salud no se guardan en caché. En producción la API se
  sirve por el mismo origen en `/api/*` (proxy de Cloudflare Pages Functions), así que el
  service worker podría interceptarla si no se excluye de forma explícita.

## Opciones consideradas

1. **Manifest y `sw.js` escritos a mano en `public/`.** Ventajas: sin dependencias nuevas.
   Desventajas: Vite cambia los nombres de los archivos con hash en cada build, así que la
   lista de precache tendría que mantenerse con un script propio, además de la lógica de
   actualización. Es más código propio y más fácil equivocarse.
2. **`vite-plugin-pwa` (Workbox).** Ventajas: genera el manifest y el service worker con la
   lista de precache del build, trae el registro con aviso de actualización
   (`registerType: 'prompt'`) y luego permite agregar Web Push (M07) con `injectManifest`.
   Desventajas: una dependencia de desarrollo más.

## Decisión

Opción 2.

**Dependencia (C-STK-3).** `vite-plugin-pwa@2.0.0` como `devDependency` con versión exacta.
Solo se ejecuta en el build. Al bundle llega `virtual:pwa-register` (unos 1-2 KB, con
`workbox-window`). `package-lock.json` (el que usa el CI con `npm ci`) y `pnpm-lock.yaml`
se actualizan juntos mientras siga abierta la deuda C-STK-4.

**Manifest** (`vite.config.js`, generado como `manifest.webmanifest` y enlazado en
`index.html` por el plugin):

| Campo | Valor |
|---|---|
| `name` / `short_name` | `Brisa · Apoyo psicoeducativo` / `Brisa` |
| `id`, `start_url`, `scope` | `/` |
| `display` | `standalone` (con `display_override: ['standalone', 'minimal-ui']`) |
| `orientation` | `portrait` (mobile-first) |
| `theme_color` | `#11534C` (`--brand-700`, el mismo de `<meta name="theme-color">`) |
| `background_color` | `#FAF9F6` (`--neutral-50` = `--surface-bg`) |
| `icons` | `pwa-192x192.png`, `pwa-512x512.png` (`any`) y `maskable-512x512.png` (`maskable`) |

El manifest no puede leer variables CSS, por eso los dos colores se copian de `tokens.css` y
se señalan con un comentario. Los PNG se generaron una sola vez desde `public/favicon.svg`
(`any`) y `public/brisa-identidad/05-app-icon-maskable.svg` (`maskable`, cuyo trazo queda
dentro de la zona segura del 80 %).

**Service worker** (`generateSW`):

- Solo precachea el *app shell* del build: `js`, `css`, `html`, `svg`, `png`, `woff2`.
  `public/brisa-identidad/` queda excluida porque son material de marca, no de la app.
- `navigateFallback: '/index.html'`, para que las rutas de `react-router` respondan desde
  la ventana instalada. `navigateFallbackDenylist: [/^\/api\//]`.
- **Sin `runtimeCaching`.** Las peticiones a `/api`, las URL firmadas de S3 y cualquier otro
  origen no pasan por ninguna caché del service worker. Ningún dato de salud queda en
  Cache Storage.
- `cleanupOutdatedCaches: true`. En desarrollo el service worker está desactivado.
- No hay modo offline (ADR-0005): sin conexión el shell puede abrir, pero la API responde
  `SIN_CONEXION` como hasta ahora.

**Actualizaciones (C-PWA-4).** `registerType: 'prompt'`. Cuando hay una versión nueva, un
aviso fijo abajo (`src/app/pwa/UpdateAvailableNotice/`, con `role="status"`) muestra «Hay una
nueva versión de Brisa.» y los botones «Actualizar» y «Más tarde». Solo se recarga al tocar
«Actualizar». Con «Más tarde», el service worker nuevo queda en espera y se activa cuando se
cierran todas las ventanas de Brisa. Así nunca se recarga en medio de un chat o de un
registro. El registro solo ocurre en producción (`import.meta.env.PROD`).

**Instalación nativa.** `src/features/users/utils/installPromptEvent.js` guarda
`beforeinstallprompt` desde el arranque (`main.jsx`), para no perderlo si llega antes de que
se monte la Home. Con ese evento, `useInstallPrompt` devuelve el modo `nativo`, y el botón
«Instalar Brisa» abre el aviso del navegador en lugar de la hoja. La hoja de instrucciones
sigue siendo el respaldo donde no existe ese evento (Safari, Firefox) o cuando la persona ya
rechazó el aviso.

**Cloudflare Pages.** `public/_headers`: `no-cache` para `sw.js` y el manifest (si no, las actualizaciones no llegan), `Content-Type: application/manifest+json`
para el manifest y caché inmutable para `/assets/*`.

**Metadatos para Safari/iOS** en `index.html`: `apple-mobile-web-app-capable`,
`mobile-web-app-capable`, `apple-mobile-web-app-title` y
`apple-mobile-web-app-status-bar-style`, además de `viewport-fit=cover`. El
`apple-touch-icon.png` (180×180) ya existía.

### Matriz de soporte esperada

| Navegador | Instalación | Cómo |
|---|---|---|
| Chrome / Edge (Android y escritorio) | Sí | Aviso nativo desde «Instalar Brisa» |
| Opera (Android) | Sí | Aviso nativo |
| Opera (escritorio) | Por verificar | Nativo si lanza el evento; si no, la hoja |
| Samsung Internet | Sí | Aviso nativo |
| Safari iOS/iPadOS 16.4+ (y Chrome/Edge en iOS) | Sí, manual | Hoja: Compartir → «Agregar a inicio» |
| Safari macOS 17+ | Sí, manual | Hoja: Archivo → «Agregar al Dock» |
| Firefox Android | Sí, manual | Hoja: menú → «Instalar» |
| Firefox Windows 143+ | Sí, manual | Hoja (ya existía) |
| Firefox Mac/Linux | No | Hoja `UNSUPPORTED` (ya existía) |

## Consecuencias

- **Lo que cambia:** la app es instalable y se abre en `standalone`. Hay aviso de
  actualización. El build genera `manifest.webmanifest`, `sw.js` y `workbox-*.js`.
- **Lo que queda pendiente o como deuda:**
  - Web Push (M07, RF-94): cambiar a `strategies: 'injectManifest'` con un service worker
    propio cuando se implemente.
  - Política CSP en `_headers` (SDD §3.2), en un PR aparte, coordinada con el proxy y S3.
  - `.github/workflows/frontend.yml` (hoy solo en `master`) no tiene que cambiar: el build ya
    incluye el service worker.
  - Verificar a mano los nombres de los menús en cada navegador y la instalación en Opera de
    escritorio.
- **Cuándo revisarla:** al implementar M07 (Web Push), si el equipo reabre ADR-0005 (offline)
  o si `vite-plugin-pwa` deja de soportar la versión de Vite del proyecto.

## Referencias

- SDD §3.2: C-PWA-1 a C-PWA-5, C-STK-3, C-STK-4 y despliegue en Cloudflare Pages.
- ADR-0001 (piezas de instalación en `users`) y ADR-0005 (sin operación offline).
- `docs/specs/ACLARACIONES.md`: A-067.
- Documentación: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/),
  [Web App Manifest (MDN)](https://developer.mozilla.org/docs/Web/Manifest).
