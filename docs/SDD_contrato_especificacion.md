# Contrato de Desarrollo Guiado por Especificación (SDD) · Brisa Frontend

**Versión:** v0.1 · BORRADOR para aprobación del equipo
**Fecha:** 2026-11-07
**Alcance:** repositorio `Brisa-Frontend` (solo frontend)
**Fuente de verdad de requerimientos:** `Especificacion Requerimientos.xlsx` (carpeta `Proyecto de grado/Requerimientos`, fuera del repo; en el repo hay una copia de referencia `docs/Especificacion_Requerimientos_0717.xlsx` que puede estar desactualizada)

---

## 0. Propósito

Este documento es el contrato entre el equipo y el repositorio sobre **cómo se escribe código en Brisa**. Aplica la metodología **Spec-Driven Development (SDD)**: una especificación clara, estructurada y formal **precede** al código, y el código es una consecuencia verificable de ella.

La palabra clave del contrato es **trazabilidad**: todo fragmento de código relevante debe poder rastrearse hasta un requerimiento (RF), y todo RF del alcance del frontend debe poder rastrearse hasta código y pruebas.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** se usan en el sentido de RFC 2119.

---

## 1. Qué es SDD y cómo se aplica aquí

SDD invierte el orden habitual «código primero, documentación después»:

| Etapa SDD | Qué significa | En Brisa |
|---|---|---|
| 1. Especificar | Se describe el comportamiento esperado de forma precisa y verificable, sin ambigüedad. | Los **RF** del Excel (y sus versiones). |
| 2. Contratar | Se traduce la especificación a un acuerdo técnico concreto entre las partes. | El **JSON que expone el backend** (contrato de API vigente) y las fichas de especificación de pantalla (sección 4). |
| 3. Verificar primero | Se definen criterios de aceptación y pruebas antes o junto con el código. | Pruebas `vitest` derivadas de los criterios de aceptación del RF. |
| 4. Implementar | Se escribe el código que satisface el contrato. | Arquitectura feature-based de `CLAUDE.md`. |
| 5. Validar y trazar | Se comprueba que el código cumple la especificación y se registra la relación. | Matriz de trazabilidad (sección 6) y PR con referencia a RF. |
| 6. Evolucionar | Si la especificación cambia, **primero** cambia la especificación y luego el código. | Procedimiento de cambio (sección 8). |

Principio rector: **si el código y la especificación difieren, el defecto está en el código, salvo que se haya aprobado un cambio de especificación.**

### 1.1 Por qué es obligatorio seguir los RF

Los requerimientos funcionales (RF) del Excel son el **acuerdo con quienes usan y validan Brisa** (estudiantes, equipo de psicología, jurados del trabajo de grado). Seguirlos al pie de la letra no es burocracia:

- **Seguridad clínica.** Brisa acompaña un proceso de salud. Un mensaje, un orden de pasos o una regla distinta a la especificada (consentimiento, perfil clínico, alertas de craving) puede afectar a una persona real.
- **Privacidad y ética.** Los RF definen qué dato se pide, cuál se oculta y qué se consiente. Improvisar un campo es improvisar un tratamiento de datos de salud.
- **Validez académica.** El trabajo de grado se evalúa contra los RF; lo que no está en ellos no cuenta como cumplimiento, y lo que se aparta de ellos cuenta como incumplimiento.
- **Trazabilidad y coordinación.** Con 4 personas y varios módulos, el RF es el único punto de acuerdo compartido: evita que frontend, backend y psicología construyan versiones distintas del mismo comportamiento.
- **Menos retrabajo.** Un cambio pedido por escrito en el RF se hace una vez; uno descubierto tarde en la demo se hace dos.

Reglas (**C-RF**):

- **C-RF-1.** Todo cambio de comportamiento visible DEBE originarse en un RF o en un cambio de RF; nunca en una preferencia personal.
- **C-RF-2.** Si el RF es ambiguo, incompleto o contradictorio, NO se interpreta por cuenta propia: se registra como aclaración (sección 7) y se consulta.
- **C-RF-3.** Si el RF y el backend difieren, se avisa al responsable del RF y del backend; hasta resolverlo, el frontend sigue el JSON real del backend y lo anota en la aclaración.
- **C-RF-5.** **No se generan ni se inventan RF nuevos.** Los RF ya existen y son los del Excel `Especificacion Requerimientos.xlsx` (carpeta `Proyecto de grado/Requerimientos`); son los únicos que se siguen. Nadie en el equipo de frontend redacta, renumera ni «completa» RF. Si algo no está cubierto por un RF, se registra como aclaración (sección 7) y lo resuelve quien mantiene el Excel.
- **C-RF-6.** Las fichas de `docs/specs/` traducen un RF existente a la interfaz; nunca lo sustituyen ni añaden comportamiento que el RF no pida.
- **C-RF-4.** Un PR DEBE nombrar los RF que implementa; un PR sin RF asociado solo es válido para deuda técnica o infraestructura y lo dice expresamente.

---

## 2. Jerarquía de fuentes de verdad

Cuando dos documentos se contradicen, gana el de menor número:

1. **Especificación de Requerimientos (Excel vigente)**: qué debe hacer el sistema (RF, reglas, mensajes, códigos).
2. **Contrato de API = el JSON real que expone el backend** (rutas, cuerpos, nombres de campos, enums y errores, tal como responde hoy). El frontend se acopla a ese JSON; no se mantienen documentos paralelos de contrato que puedan desactualizarse. Si el backend cambia, el frontend se adapta y el cambio se refleja en la ficha del RF.
3. **Design System** (`docs/prototipos/Design_System_prototipo_v1.1.html` y `src/styles/tokens.css`): cómo se ve.
4. **ADR** (`docs/decisiones/`): decisiones técnicas del equipo.
5. **`CLAUDE.md`**: convenciones de código y arquitectura.
6. **Prototipos HTML**: solo referencia visual y de lógica de validación. **Nunca** definen datos ni reglas por sí solos.

Regla: el código **NO DEBE** inventar campos, estados, endpoints, textos normativos ni códigos de error que no existan en 1 o en el JSON real del backend (2). Si falta información, se registra como **aclaración pendiente** (sección 7) y no se improvisa.

---

## 3. Arquitectura y SDD

La arquitectura basada en componentes y organizada por dominio (Feature-Based + Screaming Architecture, ver `CLAUDE.md`) es el vehículo de la trazabilidad: **una feature corresponde a un módulo de la especificación**.

| Módulo (Excel) | Feature en `src/features/` | Estado en el repo |
|---|---|---|
| M01 · Gestión de Usuario (RF-01 a RF-08) | `users` | Presente |
| M03 · Chat (RF-24 a RF-43) | `chat` | Presente (parcial, ver sección 6) |
| M04 · Cronograma (RF-09 a RF-23, RF-152 a RF-154) | `cronograma` | Presente |
| M02 · Diario (RF-40 a RF-52, RF-103) | `diario` | Sin crear |
| M05 · Seguimiento (RF-53 a RF-83) | `seguimiento` | Sin crear |
| M06 · Gamificación y Storytelling (RF-104 a RF-121) | `gamificacion` | Sin crear |
| M07 · Notificaciones (RF-75, RF-84 a RF-102) | `notificaciones` | Sin crear |
| M08 · Administrativo (RF-122 a RF-151) | Reparte pantallas en la feature del dominio que administra (p. ej. `cronograma`, `chat`) | Parcial |

Cláusulas:

- **C-ARQ-1.** Cada pantalla DEBE respetar la estructura `Page.jsx` + `hooks/` + `components/` + `utils/` y ser «página delgada».
- **C-ARQ-2.** Las features NO DEBEN importarse entre sí; lo compartido va a `shared/` (cuando lo usen 2 o más features).
- **C-ARQ-3.** Toda comunicación con el backend DEBE vivir en `features/<feature>/api/` y usar `apiClient` y las constantes de `shared/utils/` (ver C-API). Los errores DEBEN lanzarse tipados con `code`.
- **C-ARQ-4.** Las reglas de negocio puras (validaciones, transformaciones, cálculos) DEBEN vivir en `services/` para poder probarse sin interfaz.
- **C-ARQ-5.** Los catálogos y constantes derivados de la especificación (estados, enums, tipos de entrada) DEBEN vivir en `types/` con `Object.freeze` y nombrarse igual que en la especificación o el contrato.
- **C-ARQ-6.** Cuando un RF involucra dos módulos (p. ej. RF-127 administrativo autoriza algo de RF-25B chat), la pantalla vive en la feature dueña del dato y el RF se referencia desde ambos módulos en la matriz, sin importación cruzada.

### 3.1 Estructura y organización de carpetas del repositorio

#### Raíz del repositorio

```
Brisa-Frontend/
├── CLAUDE.md              → instrucciones y convenciones del proyecto
├── README.md
├── docs/                  → especificación y decisiones (ver más abajo)
├── public/                → íconos y recursos estáticos de la PWA
├── src/                   → todo el código de la aplicación
├── index.html
├── vite.config.js         → Vite + Tailwind + React Compiler
├── vitest.config.js       → pruebas
├── eslint.config.js
└── jsconfig.json
```

#### `docs/` · la especificación vive junto al código

```
docs/
├── SDD_contrato_especificacion.md   → este contrato
├── decisiones/                      → ADR (ADR-NNNN-titulo.md, no se borran)
├── prototipos/                      → prototipos HTML y Design System (referencia visual)
└── specs/                           → (por crear) fichas por RF
    ├── TRAZABILIDAD.md              → matriz RF ↔ código (sección 6)
    ├── ACLARACIONES.md              → registro de aclaraciones (sección 7)
    └── <modulo>/RF-XX.md            → ficha de cada RF (sección 4)
```

Regla **C-DOC-1**: cada documento de `docs/` DEBE tener una sola responsabilidad (contrato, ADR, ficha, entrega o prototipo) y estar enlazado desde la matriz o el índice que le corresponda.

#### `src/` · nivel superior

```
src/
├── main.jsx · App.jsx     → arranque de la aplicación
├── app/                   → composición global de la aplicación
├── features/              → un dominio de negocio por carpeta
├── shared/                → reutilizable por 2 o más features
└── styles/                → tokens.css (design tokens) y globals.css
```

| Carpeta | Contiene | NO contiene |
|---|---|---|
| `app/` | `router/` (rutas, `RequireAuth`, redirección por rol), `layouts/` (`AdminLayout`, `StudentLayout`, `ProtectedLayout`, `RegistrationLayout`), `providers/` (sesión, `AuthProvider`), `config/` (parámetros globales como los de sesión) | Lógica de un dominio concreto |
| `features/` | Un dominio por carpeta (`users`, `chat`, `cronograma`, …) | Código de más de una feature |
| `shared/` | `components/` (`ui`, `brand`, `navigation`), `hooks/`, `utils/` (`apiClient`, `dateUtils`, …), `data/` | Lógica de negocio de una sola feature |
| `styles/` | `tokens.css` (única fuente de valores de diseño) y `globals.css` | Estilos de un componente concreto |

#### Anatomía de una feature

```
features/<feature>/
├── api/          → llamadas al backend (único lugar con acceso a la red)
├── components/   → componentes usados solo por esta feature
├── context/      → estado local de la feature (Context + reducer)
├── hooks/        → hooks reutilizables dentro de la feature
├── pages/        → una carpeta por pantalla
├── services/     → reglas de negocio puras y validaciones
├── types/        → constantes y catálogos (Object.freeze)
├── utils/        → helpers de la feature
└── index.js      → barril: la ÚNICA superficie pública de la feature
```

Solo se crean las subcarpetas que la feature necesita; no se dejan carpetas vacías por simetría.

#### Anatomía de una página

```
pages/LoginPage/
├── LoginPage.jsx        → solo compone y pinta (página delgada)
├── LoginPage.test.jsx   → prueba de comportamiento
├── index.js             → reexporta la página (barril permitido: ver C-ORG-2)
├── hooks/useLoginPage.js → todo el estado y la lógica
├── components/          → piezas visuales que solo usa esta página
└── utils/               → estado del formulario, helpers de foco
```

Los componentes siguen el mismo patrón: `Componente/Componente.jsx` + `index.js` (+ `Componente.test.jsx`).

#### `shared/utils/`: la base de la capa `api/`

`shared/utils/` contiene los archivos que toda llamada al backend reutiliza. Las carpetas `api/` de cada feature se construyen **sobre ellos**: no crean su propio cliente HTTP ni escriben URLs completas.

| Archivo | Qué aporta | Cómo lo usa `features/<x>/api/` |
|---|---|---|
| `shared/utils/apiClient.jsx` | Instancia única de `axios`: `baseURL`, `withCredentials: true` (cookie de sesión) y cabecera `X-CSRF-Token` tomada de `localStorage` en cada petición | `import { apiClient } from '@/shared/utils/apiClient.jsx'` y luego `apiClient.get/post/patch/delete(...)` |
| `shared/utils/constans.jsx` | `BASE_URL` y la ruta base de cada módulo: `USUARIOS`, `CRONOGRAMA`, `CHAT` | `import { CHAT } from '@/shared/utils/constans.jsx'` y ``apiClient.post(`${CHAT}/sesiones/iniciar`, {})`` |
| `shared/utils/dateUtils.js` | Fechas en la zona horaria de la aplicación (`America/Bogota`) | Para convertir o formatear fechas que llegan del backend |

Reglas (**C-API**):

- **C-API-1.** Toda función de `api/` DEBE usar `apiClient` y la constante de su módulo de `constans.jsx`; NO DEBE usar `fetch`, crear otra instancia de `axios` ni escribir `http://localhost…` a mano.
- **C-API-2.** Un módulo nuevo agrega su constante a `constans.jsx` (``export const CHAT = `${BASE_URL}/chat`;``). Es el único cambio permitido en `shared/` dentro de una rama de feature, y debe ser de una línea; cualquier otro cambio en `shared/` va en PR aparte (C-ORG-3).
- **C-API-3.** El cuerpo de un `POST`/`PATCH` sin datos se envía como `{}`, **nunca `null`**: con `Content-Type: application/json` axios serializa `null` como el texto `"null"` y el backend responde `400 Bad Request` (`Unexpected token 'n', "null" is not valid JSON`).
- **C-API-4.** `api/` devuelve el JSON del backend y lanza errores tipados con `code`, `status` y el mensaje del backend (que puede venir en `message` o en `mensaje`). La traducción a modelos de interfaz va en `services/`.
- **C-API-5.** Cada endpoint vive en su propio archivo (`api/<tema>/<accion>.js`) y se importa por su ruta, sin barril (C-ORG-9). Es la base para integrar cada módulo; el módulo de chat (M03) se integra con este patrón, empezando por RF-24 (`features/chat/api/sesion/iniciarSesionConversacional.js`).

#### Relación entre carpetas y capas de la especificación

| Capa | Carpeta | Pregunta que responde | Se prueba con |
|---|---|---|---|
| Contrato con backend | `features/*/api/` | ¿Qué se envía y se recibe? | Pruebas de la capa `api` (errores tipados por `codigo`) |
| Regla de negocio | `services/`, `types/` | ¿Qué dice el RF que es válido? | Pruebas unitarias puras |
| Estado y orquestación | `hooks/`, `context/`, `utils/` | ¿Cómo reacciona la pantalla? | Pruebas de hook o de reducer |
| Presentación | `pages/`, `components/` | ¿Cómo se ve y qué muestra? | Pruebas de página (ADR-0002) |
| Identidad visual | `styles/tokens.css` | ¿Con qué valores de diseño? | Revisión contra el Design System |

#### Reglas de organización (cláusulas **C-ORG**)

- **C-ORG-1.** Las pruebas viven junto al archivo que prueban (`*.test.js` / `*.test.jsx`), no en una carpeta `__tests__` aparte.
- **C-ORG-2.** Los barriles (`index.js` que solo reexporta) se permiten únicamente donde aportan organización: la carpeta de cada componente o página y la raíz de cada feature (`features/<x>/index.js`, la superficie pública que usa el router). Entre features no hay importaciones.
- **C-ORG-9.** **No se crean archivos barril en `app/` ni en `api/`.** Un archivo que solo existe para reexportar una función de otro archivo que ya puede importarse directamente es ruido: se importa el archivo real (por ejemplo `../../../api/sesion/iniciarSesionConversacional.js`). Cada función de `api/` vive en su propio archivo y se importa por su ruta.
- **C-EXT-1.** **Extensión según el contenido.** `.jsx` SOLO si el archivo contiene JSX (componentes, páginas, layouts y providers que devuelven JSX). `.js` para todo lo demás: hooks, servicios, `api/`, `utils/`, `types/`, reducers, contextos sin JSX, configuración, constantes y pruebas sin JSX. Un `.js` con JSX o un `.jsx` sin JSX es un defecto que se corrige al detectarlo.
- **C-EXT-2.** Los archivos de prueba siguen la misma regla: `*.test.jsx` solo si renderizan JSX; si no, `*.test.js`.
- **C-ORG-3.** Un componente sube de `features/<x>/components/` a `shared/components/` solo cuando una segunda feature lo necesita. La subida se hace en un PR aparte y pequeño, no dentro de una rama de feature.
- **C-ORG-4.** Un archivo pertenece al nivel más bajo posible: componente de página → página → feature → `shared`.
- **C-ORG-5.** Nombres de carpetas, archivos, componentes y hooks en **inglés**; PascalCase para componentes y páginas, `use…` para hooks, camelCase para utilidades y servicios. Los textos visibles al usuario van en español.
- **C-ORG-6.** Nada de datos simulados dentro de `api/`. Los datos de demostración o de prueba van en `data/` o `test-utils/` de la feature y NO DEBEN usarse en producción.
- **C-ORG-7.** Una feature nueva nace con su módulo de la especificación: se crea la carpeta, su `index.js` y su fila en la matriz de trazabilidad en el mismo PR.
- **C-ORG-8.** Las rutas se declaran únicamente en `app/router/` y cada pantalla se asocia a su RF en la matriz.

#### Desviaciones detectadas hoy (deuda a corregir de forma gradual)

Estas diferencias entre la norma y el estado actual del repo se registran, sin corregirlas aquí, para no mezclar refactor con tareas de feature:

| Observación | Norma | Acción sugerida |
|---|---|---|
| `features/users/api/` es plano y con nombres con errores ortográficos (`obtenerConsetimiento`, `resgistratio`, `validacionConsetimeinto`) | C-ORG-5 y `CLAUDE.md` (que cita `api/registration/`) | Renombrar en un PR aparte y unificar la referencia de `CLAUDE.md` |
| `shared/utils/constans.jsx` (nombre con errata) | C-ORG-5 | Renombrar en un PR aparte dentro de `shared/` |
| `features/cronograma/` tiene `data/` y `test-utils/` sin norma escrita | C-ORG-6 | Documentar su uso (o crear un ADR) |
| Código anterior a C-EXT-1: unos 48 archivos `.jsx` sin JSX en `users/`, `cronograma/` y `shared/` (`api/*.jsx`, `apiClient.jsx`, `constans.jsx`, `useLogoutHandler.jsx` y algunas pruebas) | C-EXT-1, C-EXT-2 | Migrar por feature en PR aparte, a cargo de quien tenga el módulo. `features/chat/` ya cumple |
| Barriles en `app/` (`layouts/*/index.js`, `providers/index.js`) | C-ORG-9 | Eliminarlos en un PR aparte de `app/`. `features/chat/api/` ya cumple |
| `users` contiene piezas de instalación PWA | ADR-0001 (propuesta) | Esperar decisión del equipo |

### 3.2 Stack tecnológico, producto y equipo

#### El producto

Brisa es una **PWA (Progressive Web App) mobile-first** de apoyo **psicoeducativo y psicoconductual** para la **cesación del consumo de vapeo** (cigarrillo electrónico) en estudiantes universitarios (Universidad Surcolombiana, trabajo de grado). Ofrece, entre otros, terapia conversacional por chat (M03), diario (M02), cronograma de contenidos (M04), seguimiento (M05), gamificación (M06) y notificaciones (M07), además de un módulo administrativo para el equipo de psicología (M08).

Consecuencias para la especificación:

- Es una **aplicación web instalable**, no una app nativa de tienda. Se distribuye por URL y se instala desde el navegador.
- Maneja **datos de salud y de consumo**: la privacidad y el consentimiento informado son requisitos de primer orden (cláusulas C-PRI y C-SEG, sección 10).
- Debe funcionar con conectividad inestable (RF-34, RF-34B, RF-35 de operación offline y sincronización diferida).

#### Stack vigente

| Capa | Tecnología | Notas |
|---|---|---|
| Lenguaje | JavaScript (ES2024) | **Sin TypeScript** |
| UI | **React 19** | Aplicación web (DOM), componentes funcionales con hooks |
| Compilador | **React Compiler** (`babel-plugin-react-compiler`) | Memoriza automáticamente: no agregar `useMemo`/`useCallback` manuales sin justificación |
| Build y servidor de desarrollo | **Vite** | `npm run dev` / `npm run build` / `npm run preview` |
| Ruteo | `react-router-dom` v7 | Rutas solo en `app/router/` |
| Estilos | **Tailwind CSS 4** vía `@tailwindcss/vite` | Valores de diseño siempre desde `src/styles/tokens.css` |
| Iconos | `lucide-react` | Nunca emoji en la interfaz |
| Tipografías | Manrope (texto) e IBM Plex Mono (mono) vía `@fontsource` | Importadas en `main.jsx` |
| HTTP | `axios`, encapsulado en `shared/utils/apiClient.jsx` | Ningún acceso a red fuera de `features/*/api/` |
| Pruebas | **Vitest** | Sin jsdom ni Testing Library (ADR-0002) |
| Calidad | ESLint, Prettier, Husky + lint-staged | Verificación antes de cada commit |
| Hosting | **Cloudflare Pages** | Ver «Despliegue» |
| CI/CD | **GitHub Actions** | Ver «Despliegue» |

> **Aclaración sobre React Native.** El equipo mencionó React Native, pero el repositorio **no lo usa**: es React 19 para web con Vite, y `CLAUDE.md` fija el stack («no cambiar sin acuerdo del equipo»). Una PWA corre en el navegador y no necesita React Native; adoptarlo supondría otro proyecto (Expo/Metro, componentes nativos, sin Tailwind web ni service worker). Este contrato documenta el stack **real**. Si el equipo quiere migrar a React Native, eso es un cambio de arquitectura que exige un ADR aprobado antes de tocar el código.

Reglas del stack (cláusulas **C-STK**):

- **C-STK-1.** El stack NO DEBE cambiarse sin acuerdo del equipo registrado en un ADR (`docs/decisiones/`).
- **C-STK-2.** NO DEBEN añadirse librerías de UI externas (MUI, Chakra, etc.) ni de iconos distintas de `lucide-react`.
- **C-STK-3.** Una dependencia nueva DEBE justificarse en el PR (qué problema resuelve, por qué no basta lo existente, peso aproximado en el bundle) y fijarse con versión concreta.
- **C-STK-4.** El gestor de paquetes DEBE ser uno solo. Hoy hay `package-lock.json` y `pnpm-lock.yaml` a la vez: el equipo debe elegir uno y eliminar el otro (ver desviaciones).
- **C-STK-5.** Las variables de entorno del cliente usan el prefijo `VITE_`. **No se guardan secretos en el frontend**: todo lo que llega al bundle es público.

#### Requisitos de PWA (cláusulas **C-PWA**)

El repositorio tiene hoy íconos y componentes de instalación (`InstallAppButton`, `InstallSheet`, `useInstallPrompt`), pero **no se encontró manifiesto web ni service worker**. Se establecen como requisitos de la especificación:

- **C-PWA-1.** La app DEBE ser instalable: `manifest.webmanifest` (nombre, `display: standalone`, colores desde los tokens, íconos 192/512 y maskable) enlazado desde `index.html`.
- **C-PWA-2.** DEBE existir un service worker con estrategia de caché explícita para el *app shell*. Los datos de salud NO DEBEN quedar en caché sin protección ni sin una regla documentada (RF-34, RF-34B).
- **C-PWA-3.** La operación offline y la sincronización diferida se diseñan por RF (RF-34, RF-34B, RF-35) y se documentan en su ficha antes de implementarse.
- **C-PWA-4.** Las actualizaciones del service worker DEBEN avisar al usuario y no recargar en medio de una sesión de chat o de un registro.
- **C-PWA-5.** Se DEBERÍA medir con Lighthouse (PWA, rendimiento y accesibilidad) en cada corte de sprint.

#### Despliegue: Cloudflare Pages + GitHub Actions

Flujo previsto (la configuración concreta se documenta en un ADR cuando se cree el workflow):

```
Pull Request ─► GitHub Actions: install · lint · test · build ─► Preview deployment (Cloudflare Pages)
      │
      ▼ (merge)
rama principal ─► GitHub Actions: install · lint · test · build ─► Producción (Cloudflare Pages)
```

| Aspecto | Decisión / requisito |
|---|---|
| Directorio de salida | `dist/` (resultado de `vite build`) |
| Comando de build | `npm run build` (o el del gestor elegido en C-STK-4) |
| Versión de Node | Fijada en el workflow y en `.nvmrc`/`engines`, la misma en local y en CI |
| Secretos de despliegue | Solo en *GitHub Secrets* (token y ID de cuenta de Cloudflare); nunca en el repo |
| Variables de la app | `VITE_*` configuradas por entorno (preview/producción) en Cloudflare Pages |
| Rutas de la SPA | Regla de fallback a `index.html` (archivo `_redirects` o equivalente en `public/`) para que `react-router` funcione al recargar |
| Cabeceras de seguridad | `_headers` en `public/` (CSP, `X-Content-Type-Options`, `Referrer-Policy`) y revisión de HTTPS, obligatorio para PWA |
| Dominio y backend | La API vive en otro origen: CORS y cookies de sesión (`withCredentials`, `X-CSRF-Token`) deben validarse con backend para cada entorno |

Cláusulas **C-CICD**:

- **C-CICD-1.** Ningún PR DEBE fusionarse si fallan lint de la feature tocada, pruebas o build en CI.
- **C-CICD-2.** Cada PR DEBERÍA generar una *preview deployment* para que la revisión incluya la verificación visual a 360 px.
- **C-CICD-3.** El despliegue a producción solo ocurre desde la rama principal, tras un merge aprobado. No se despliega desde máquinas locales.
- **C-CICD-4.** El workflow NO DEBE imprimir secretos ni variables sensibles en los registros.
- **C-CICD-5.** Una vez creado el workflow, debe documentarse en `docs/decisiones/` y referenciarse desde este contrato.

#### Equipo de ingeniería (4 personas)

Con un equipo de 4 el proceso debe ser **ligero pero trazable**; el contrato se adapta así:

| Práctica | Acuerdo |
|---|---|
| Tamaño de PR | Pequeños (< ~300 líneas), para que la revisión sea rápida |
| Revisión | Al menos **una** aprobación de otra persona del equipo; nadie fusiona su propio PR sin revisión |
| Reparto | Una persona dueña por feature/módulo en curso, para evitar conflictos en `shared/` y en el router |
| Cambios en `shared/` | PR aparte y pequeño, avisado al resto (C-ORG-3) |
| Rama principal | Protegida: sin *push* directo, con CI obligatorio |
| Contrato con backend | El JSON real que expone el backend; el frontend se adapta a él y avisa de cualquier diferencia con el RF (C-RF-3) |
| Sincronización | `git pull --rebase` diario y revisión semanal del Excel de requerimientos (C-CAM-2) |
| Documentación | Las decisiones técnicas se registran en ADR; un ADR por decisión, sin borrarlos |

Los nombres y responsabilidades concretas se asignan en la sección 11 al aprobar el contrato.

#### Desviaciones detectadas hoy (stack y entorno)

| Observación | Norma | Acción sugerida |
|---|---|---|
| No existe `.github/workflows/` | C-CICD | Crear el workflow de CI y despliegue y documentarlo en un ADR |
| No hay manifiesto web ni service worker | C-PWA-1, C-PWA-2 | Tarea de PWA con su ficha (RF-34, RF-34B, RF-35) |
| Conviven `package-lock.json` y `pnpm-lock.yaml` | C-STK-4 | Elegir gestor y borrar el otro lockfile |
| `lint-staged` apunta a `src/features/auth`, `student` y `psychology`, que no existen; las features reales son `users`, `chat` y `cronograma` | Calidad antes de commit | Actualizar `lint-staged` a las carpetas reales o a `src/**` |
| No hay `public/_redirects` ni `_headers` | Despliegue en Pages | Añadirlos al crear el workflow |
| `CLAUDE.md` menciona `master` y el repo usa `develop` como rama principal | Consistencia de flujo | Unificar la rama base en `CLAUDE.md` y en el contrato |

---

## 4. Estructura de una especificación (formato formal)

Todo RF que el frontend implemente DEBE tener su **ficha de especificación frontend** antes de empezar a codificarlo. La ficha NO reemplaza al RF: lo concreta para la interfaz. Se guarda en `docs/specs/<modulo>/RF-XX.md` y sigue esta plantilla:

```markdown
# RF-XX · <título exacto del Excel>

- **Versión del RF que se implementa:** X.Y.Z   (la del Excel al momento de escribir la ficha)
- **Módulo / feature:** Mxx · <feature>
- **Rol(es) que lo usan:** ESTUDIANTE | PSICOLOGO | ADMIN
- **Ruta(s):** /app/...
- **Contrato de API:** método, ruta y ejemplo del JSON real que responde (éxito y errores) | «No aplica (solo UI)» | «Pendiente»
- **Dependencias:** RF-YY, RF-ZZ

## Comportamiento esperado
Lista numerada de reglas verificables, copiadas o derivadas literalmente del RF.

## Criterios de aceptación
Formato Dado / Cuando / Entonces. Cada criterio recibe un ID: CA-XX-1, CA-XX-2…

## Estados de interfaz
carga · vacío · éxito · error (por `codigo`) · sin conexión (si aplica)

## Textos normativos
Mensajes que el RF fija y que deben mostrarse VERBATIM.

## Fuera de alcance
Qué parte del RF corresponde al backend o a otro módulo.

## Aclaraciones pendientes
Dudas abiertas, con responsable.

## Trazabilidad
Archivos de código y pruebas que lo implementan (se actualiza en el PR).
```

Reglas de calidad de una ficha (**C-SPEC**):

- **C-SPEC-1.** Cada criterio de aceptación DEBE ser verificable (observable por una prueba o por una revisión manual con pasos).
- **C-SPEC-2.** Los textos que el RF declara fijos (mensajes de error, consentimiento informado) DEBEN copiarse VERBATIM y NO DEBEN parafrasearse.
- **C-SPEC-3.** La ficha DEBE indicar qué parte del RF **no** cubre el frontend para evitar implementaciones inventadas (ejemplo previo: RF-25B y RF-25C se entregaron solo como interfaz, sin peticiones HTTP).
- **C-SPEC-4.** Una ficha NO DEBE contener decisiones de implementación (nombres de hooks, librerías). Eso pertenece al código o a un ADR.

---

## 5. Ciclo de trabajo por tarea (flujo obligatorio)

```
RF (Excel) ─► Ficha frontend ─► Contrato API ─► Pruebas ─► Código ─► PR trazable
     ▲                                                                  │
     └────────────── cambio de especificación (sección 8) ◄─────────────┘
```

1. **Leer el RF vigente** y anotar su versión.
2. **Escribir o actualizar la ficha** (sección 4). Si hay ambigüedad, registrarla en «Aclaraciones pendientes» y consultarla antes de codificar.
3. **Acoplarse al JSON real del backend.** Se prueba el endpoint (por ejemplo con el backend local) y la ficha anota el JSON de éxito y de error tal como llega. El frontend se adapta a ese JSON y NO inventa campos. Si el endpoint aún no existe, el frontend trabaja contra la interfaz (props) y NO pone datos simulados dentro de `api/`.
4. **Escribir las pruebas** a partir de los criterios de aceptación: primero las de `services/` y `utils/` (puras), luego las de comportamiento de la pantalla (según ADR-0002, sin jsdom ni Testing Library).
5. **Implementar** siguiendo la arquitectura (sección 3) y el Design System.
6. **Abrir PR** pequeño (< ~300 líneas) que referencie RF y versión (sección 9).
7. **Actualizar la matriz de trazabilidad** (sección 6) en el mismo PR.

Nombre de rama y commits: ver `CLAUDE.md` (Conventional Commits con la tarea). El mensaje DEBERÍA incluir el RF: `feat(chat): consultar árboles personalizados (RF-25C, #NNN)`.

---

## 6. Matriz de trazabilidad RF ↔ código

La matriz es un artefacto vivo: se mantiene en `docs/specs/TRAZABILIDAD.md` (crear al aprobar este contrato). Estado inicial, derivado de las rutas de `AppRouter.jsx` y de las fichas existentes. **Los estados marcados «Por auditar» deben confirmarse con el equipo; no se asumen cumplidos.**

Leyenda de estado: **Cubierto** (UI + contrato + pruebas) · **Parcial** (falta algo, ver nota) · **Pendiente** (en alcance, sin código) · **Fuera de alcance FE** (lo resuelve el backend) · **Por auditar**.

| RF | Título (Excel) | Feature / ubicación | Estado inicial |
|---|---|---|---|
| RF-01 | Registro de usuarios | `users` · `CreateAccountPage` (`/registro/cuenta`) | Por auditar |
| RF-02 | Autenticación de usuarios | `users` · `LoginPage` (`/login`) | Por auditar |
| RF-03, RF-04 | Gestión de roles y permisos | `app/` (layouts y guardas de rutas) | Por auditar |
| RF-05 | Consentimiento informado y captura de línea base | `users` · `ConsentPage`, `BaselinePage`, `ReconsentPage` | Por auditar |
| RF-06 | Revisión y confirmación de datos de registro | `users` · `ReviewPage`, `RegistrationCompletedPage` | Por auditar |
| RF-07 | Recuperación de contraseña | `users` · `RecoverRequestPage`, `RecoverResetPage` | Por auditar |
| RF-08 | Cierre de sesión (incluye inactividad) | `app/providers` + `users` | Por auditar |
| RF-09 a RF-20 | Estructura temporal, contenido, disponibilidad, reprogramación, unidades | `cronograma` · páginas `/app/administrativo/cronograma/*` | Por auditar |
| RF-21 | Consulta del contenido vigente por usuario | `cronograma` · `CurrentContentPage` | Por auditar |
| RF-22, RF-22B, RF-23 | Ubicación temporal, pausas administrativas, información temporal | `cronograma` · `TemporalInformationPage`, pausas | Por auditar |
| RF-152 a RF-154 | Contenido psicoeducativo y recursos | `cronograma` · `ContentFormPage`, `ContentResourcesPage` | Por auditar |
| RF-24, RF-24B | Inicialización de sesión conversacional y perfil clínico | `chat` · `ChatEntryPage` (`/app/estudiante/chat`) | Parcial: solo pantalla de entrada (ficha `docs/specs/M03/RF-24.md`) |
| RF-25B | Habilitar modalidad personalizada | `chat` · `ProgramModalityPage` | Parcial: solo UI, sin HTTP |
| RF-25C | Consulta de árboles personalizados | `chat` · `PersonalizedTreesPage` | Parcial: solo consulta, sin HTTP |
| RF-26 a RF-29 | Mensajes, entradas estructuradas, validación, transición | `chat` (`types/`, `services/`) | Pendiente |
| RF-30 a RF-35 | Persistencia, estado, recuperación, multimedia, offline, sincronización | `chat` | Pendiente |
| RF-43 | Botón SOS Craving | `chat` | Pendiente (esbozo en contrato) |
| RF-40 a RF-52, RF-103 | Diario | `diario` (por crear) | Pendiente |
| RF-53 a RF-83 | Seguimiento | `seguimiento` (por crear) | Pendiente / mayormente backend |
| RF-104 a RF-121 | Gamificación y storytelling (usa `--accent-*`) | `gamificacion` (por crear) | Pendiente |
| RF-75, RF-84 a RF-102 | Notificaciones | `notificaciones` (por crear) | Pendiente / mayormente backend |
| RF-122 a RF-151 | Módulo administrativo | Pantallas en la feature dueña del dato | Parcial (cronograma y chat) |

Nota: en el Excel hay códigos duplicados o irregulares (RF-75 aparece en M05 y M07; `RF93` sin guion; RF-146 no aparece; títulos vacíos en RF-54, RF-55, RF-89, RF-90, RF-92; RF-109 y RF-110 con el mismo título). Se registran como **aclaraciones pendientes** (sección 7) y no se resuelven por suposición.

---

## 7. Gestión de aclaraciones

- **C-ACL-1.** Toda ambigüedad, contradicción o dato faltante DEBE registrarse en `docs/specs/ACLARACIONES.md` con: ID (`A-NNN`), RF afectado, pregunta, responsable de responder, estado (Abierta / Resuelta) y fecha.
- **C-ACL-2.** Mientras una aclaración esté abierta, el código afectado NO DEBE inventar la respuesta; PUEDE implementarse la parte no afectada.
- **C-ACL-3.** Al resolverse, la respuesta se refleja primero en el Excel o en el contrato, y después en la ficha y el código.

---

## 8. Procedimiento de cambio de especificación

Los RF se actualizan paulatinamente, por lo que este contrato **asume cambio continuo**.

1. **Detección.** Quien note una versión nueva de un RF (columna «Versión» del Excel) abre una tarea «Sincronizar RF-XX vX.Y → vX.Z».
2. **Análisis de impacto.** Se compara el RF anterior y el nuevo, se localiza el RF en la matriz (sección 6) y se listan fichas, contratos, pruebas y código afectados.
3. **Actualización en orden.** Ficha → contrato (si cambian datos) → pruebas → código. **Nunca** al revés.
4. **Registro.** La ficha anota la nueva versión y un breve historial de cambios; si el cambio es técnico y afecta a otras features, se escribe un ADR.
5. **Compatibilidad.** Si el backend cambia el JSON, el frontend se adapta y la ficha del RF anota el cambio en su historial.

Reglas:

- **C-CAM-1.** Un PR de código que implementa una versión de RF distinta de la de la ficha NO DEBE aprobarse.
- **C-CAM-2.** Antes de cada entrega o corte de sprint se DEBERÍA revisar el Excel para detectar RF modificados.
- **C-CAM-3.** Las versiones en el Excel tienen formatos inconsistentes (algunas celdas se leen como fecha, p. ej. «2026-01-01»); en las fichas se normaliza a `X.Y.Z` y se registra la discrepancia como aclaración.

---

## 9. Definición de «Hecho» (DoD) por RF

Un RF del frontend se considera **Cubierto** cuando se cumple **todo** lo siguiente:

- [ ] Existe la ficha en `docs/specs/<modulo>/RF-XX.md` con la versión del RF vigente.
- [ ] Cada criterio de aceptación tiene al menos una prueba, o una verificación manual documentada en la ficha.
- [ ] Los estados de interfaz (carga, vacío, error, éxito y, si aplica, sin conexión) están implementados.
- [ ] Los errores se manejan por `codigo` y el `message` del backend se muestra tal cual.
- [ ] Cumple el Design System: solo tokens, sin colores hardcodeados, sin emoji, solo `lucide-react`, contraste AA 4.5:1, el estado nunca se comunica solo con color, inputs con error muestran mensaje de texto.
- [ ] Mobile-first a 360 px, una columna.
- [ ] `npx eslint src/features/<feature>` sin errores y `npm run test` en verde.
- [ ] No hay `console.log` de credenciales, datos de consumo ni respuestas del estudiante.
- [ ] La matriz de trazabilidad está actualizada en el mismo PR.
- [ ] El PR referencia el RF y su versión.

Plantilla de descripción de PR:

```markdown
## Especificación
- RF: RF-XX (vX.Y.Z) · Ficha: docs/specs/<modulo>/RF-XX.md
- Criterios cubiertos: CA-XX-1, CA-XX-2
- Criterios NO cubiertos y motivo: …
- Aclaraciones abiertas: A-NNN

## Verificación
- Pruebas añadidas: …
- Verificación manual: …
```

---

## 10. Reglas transversales derivadas de la especificación

Estas reglas ya existen en `CLAUDE.md` y se elevan aquí a cláusulas verificables del contrato:

- **C-SEG-1.** El frontend NO DEBE enviar `id_usuario` (lo toma el backend de la sesión) ni mostrar el perfil clínico (`tipo_dependencia`, `tipo_craving`) al estudiante.
- **C-SEG-2.** Las peticiones que modifican estado DEBEN llevar `X-CSRF-Token` (lo agrega `apiClient`); la sesión es por cookie.
- **C-PRI-1.** NO DEBE registrarse en consola ni en almacenamiento no controlado información de salud, consumo, credenciales ni respuestas del estudiante.
- **C-TXT-1.** Los textos normativos (consentimiento informado, nodos de chat) se muestran VERBATIM.
- **C-UI-1.** Textos visibles en español; nombres de archivos, componentes y hooks en inglés.
- **C-UI-2.** `--accent-*` queda reservado para gamificación (M06).
- **C-FLEX-1.** Los parámetros que la especificación declara configurables (tiempos de inactividad, umbrales, límites) DEBEN parametrizarse en un solo lugar y NO hardcodearse en varios sitios.

---

## 11. Roles y responsabilidades

| Rol | Responsabilidad en SDD |
|---|---|
| Responsable de especificación (analista/psicología) | Mantener el Excel; comunicar los cambios de versión de RF. |
| Frontend | Fichas, contratos propuestos, pruebas, código y matriz. |
| Backend | Mantener estable el JSON que expone y avisar de cualquier cambio de rutas, campos o códigos de error. |
| Revisor de PR | Verificar el DoD (sección 9) y que el PR no se aparte de la ficha. |

---

## 12. Adopción gradual

Aplicar SDD retroactivamente a todo el código sería inviable. Se adopta así:

1. **Ahora:** aprobar este contrato y crear `docs/specs/` con `TRAZABILIDAD.md`, `ACLARACIONES.md` y la plantilla de ficha.
2. **Código nuevo:** toda tarea nueva sigue el flujo de la sección 5 desde el primer día.
3. **Código existente:** se documenta bajo demanda, en orden de riesgo: primero las partes con requisitos legales o de salud (RF-05 consentimiento, RF-01/02 credenciales), luego lo que se vaya a modificar.
4. **Revisión:** reevaluar este contrato al cierre de cada módulo y registrar los ajustes como nueva versión.

---

## 13. Referencias

- Metodología: Spec-Driven Development (especificación formal como artefacto primario que precede y guía la implementación).
- `CLAUDE.md` · arquitectura, convenciones y reglas de dominio.
- `docs/specs/M03/RF-24.md` · ejemplo de ficha de RF.
- `docs/decisiones/` · ADR vigentes.
- `docs/prototipos/` · prototipos y Design System.

## Historial de este documento

| Versión | Fecha | Cambio |
|---|---|---|
| v0.1 | 2026-11-07 | Versión inicial (borrador). |
