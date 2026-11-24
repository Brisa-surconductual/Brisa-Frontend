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
- **C-API-4.** `api/` devuelve el JSON del backend y lanza errores tipados con `code`, `status` y el mensaje del backend (que puede venir en `message` o en `mensaje`). La traducción a modelos de interfaz va en `services/`. El tratamiento de los errores sigue C-ERR-1 a C-ERR-6.
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
| `users` contiene piezas de instalación PWA | ADR-0001 (propuesta) | Esperar decisión del equipo. ADR-0006 las conecta al aviso nativo de instalación sin moverlas |

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

El repositorio tiene íconos y componentes de instalación (`InstallAppButton`, `InstallSheet`, `useInstallPrompt`). Desde ADR-0006 (2026-11-21) también tiene manifiesto web y service worker generados con `vite-plugin-pwa`. Se establecen como requisitos de la especificación:

- **C-PWA-1.** La app DEBE ser instalable: `manifest.webmanifest` (nombre, `display: standalone`, colores desde los tokens, íconos 192/512 y maskable) enlazado desde `index.html`.
- **C-PWA-2.** DEBE existir un service worker con estrategia de caché explícita para el *app shell*. Los datos de salud NO DEBEN quedar en caché sin protección ni sin una regla documentada (RF-34, RF-34B).
- **C-PWA-3.** La operación offline y la sincronización diferida se diseñan por RF (RF-34, RF-34B, RF-35) y se documentan en su ficha antes de implementarse.
- **C-PWA-4.** Las actualizaciones del service worker DEBEN avisar al usuario y no recargar en medio de una sesión de chat o de un registro.
- **C-PWA-5.** Se DEBERÍA medir con Lighthouse (PWA, rendimiento y accesibilidad) en cada corte de sprint.

#### Flujo de ramas y despliegue

Se manejan 3 ramas principales:

| Rama | Rol |
|---|---|
| `develop` | Integración de funcionalidades en desarrollo. |
| `test` | Rama de evaluación/QA antes de promover a `develop`. |
| `master` | Producción. Al hacer merge aquí se despliega automáticamente: el backend en Render y el frontend en Cloudflare Pages. |

Flujo estándar de un desarrollador:

1. Crea su propia rama `feat/...` desde `develop`.
2. Envía el PR apuntando a `test`.
3. Se mergea a `test` y se evalúa ahí.
4. De `test` pasa a `develop`.
5. De `develop` pasa finalmente a `master` (dispara el despliegue en Cloudflare Pages).

```
feat/... ──► PR ──► test ──► develop ──► master ──► despliegue (Cloudflare Pages)
 (desde develop)   (se evalúa)  (integra)   (producción)
```

Cláusulas **C-GIT**:

- **C-GIT-1.** Toda funcionalidad nace en una rama `feat/...` creada desde `develop`. NO se trabaja directamente sobre `develop`, `test` ni `master`.
- **C-GIT-2.** El PR de una funcionalidad apunta a `test`, no a `develop` ni a `master`.
- **C-GIT-3.** Una funcionalidad solo avanza de `test` a `develop` después de evaluarse en `test`, y solo avanza de `develop` a `master` cuando está lista para producción.
- **C-GIT-4.** `master` es la única rama que despliega a producción. Un merge a `master` dispara el despliegue; por eso solo recibe lo que ya pasó por `test` y `develop`.
- **C-GIT-5.** El nombre de la rama sigue `feat/...` y los commits siguen Conventional Commits con la tarea (ver `CLAUDE.md`). Los PR son pequeños (< ~300 líneas) y llevan los RF que implementan (C-RF-4).

#### Despliegue: Cloudflare Pages + GitHub Actions

Flujo previsto (la configuración concreta se documenta en un ADR cuando se cree el workflow):

```
Pull Request ─► GitHub Actions: install · lint · test · build ─► Preview deployment (Cloudflare Pages)
      │
      ▼ (merge)
master ─► GitHub Actions: install · lint · test · build ─► Producción (Cloudflare Pages)
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
- **C-CICD-3.** El despliegue a producción solo ocurre desde `master`, tras un merge aprobado (ver el flujo de ramas). No se despliega desde máquinas locales.
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
| Ramas `develop`, `test` y `master` | Protegidas: sin *push* directo, con CI obligatorio; los cambios entran por PR (C-GIT) |
| Contrato con backend | El JSON real que expone el backend; el frontend se adapta a él y avisa de cualquier diferencia con el RF (C-RF-3) |
| Sincronización | `git pull --rebase` diario y revisión semanal del Excel de requerimientos (C-CAM-2) |
| Documentación | Las decisiones técnicas se registran en ADR; un ADR por decisión, sin borrarlos |

Los nombres y responsabilidades concretas se asignan en la sección 11 al aprobar el contrato.

#### Desviaciones detectadas hoy (stack y entorno)

| Observación | Norma | Acción sugerida |
|---|---|---|
| No existe `.github/workflows/` | C-CICD | Crear el workflow de CI y despliegue y documentarlo en un ADR |
| ~~No hay manifiesto web ni service worker~~ | C-PWA-1, C-PWA-2 | **Resuelto en ADR-0006** (FE-PWA-01, 2026-11-21): manifest, service worker que solo precachea el app shell y aviso de actualización. RF-34, RF-34B y RF-35 están eliminados (ADR-0005) |
| Conviven `package-lock.json` y `pnpm-lock.yaml` | C-STK-4 | Elegir gestor y borrar el otro lockfile |
| `lint-staged` apunta a `src/features/auth`, `student` y `psychology`, que no existen; las features reales son `users`, `chat` y `cronograma` | Calidad antes de commit | Actualizar `lint-staged` a las carpetas reales o a `src/**` |
| No hay `public/_redirects`; `_headers` solo tiene la caché de la PWA (ADR-0006) | Despliegue en Pages | Añadir la CSP y las demás cabeceras de seguridad al crear el workflow |
| `CLAUDE.md` indica ramas «desde `master`», pero el flujo vigente es `feat/...` desde `develop` con PR a `test` | C-GIT-1, C-GIT-2 | Actualizar la sección Git de `CLAUDE.md` para que coincida con el flujo de ramas |

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
| RF-43 | Botón SOS Craving | `chat` · `SosButton` (global en `StudentLayout`), `SosInterventionPage` (`/app/estudiante/sos`), `services/sos/` | Parcial: MVP frontend implementado y probado con HTTP simulado; integración contra el backend desplegado y medición de < 300 ms en navegador pendientes (ver nota) |
| RF-40 a RF-52, RF-103 | Diario | `diario` (por crear) | Pendiente |
| RF-53 a RF-83 | Seguimiento | `seguimiento` (por crear) | Pendiente / mayormente backend |
| RF-104 a RF-121 | Gamificación y storytelling (usa `--accent-*`) | `gamificacion` (por crear) | Pendiente |
| RF-75, RF-84 a RF-102 | Notificaciones | `notificaciones` (por crear) | Pendiente / mayormente backend |
| RF-122 a RF-151 | Módulo administrativo | Pantallas en la feature dueña del dato | Parcial (cronograma y chat) |
| RF-132 | Vista agregada de la cohorte activa | `administracion` · `CohortAggregatePage` (`/app/administrativo/cohortes/:idCohorte/vista-agregada`) | Parcial: solo frontend con datos de demostración (ver nota) |
| RF-133 | Vista agregada de progresión narrativa y gamificación | `administracion` · `CohortNarrativePage` (`/app/administrativo/cohortes/:idCohorte/vista-narrativa`) | Parcial: solo frontend con datos de demostración (ver nota) |
| RF-134 | Vista agregada de efectividad de notificaciones | `administracion` · `CohortNotificationsPage` (`/app/administrativo/cohortes/:idCohorte/vista-notificaciones`) | Parcial: solo frontend con datos de demostración (ver nota) |
| RF-140 | Dashboard principal | `administracion` · `CohortDashboard`, montado en `PsychologyHomePage` (`/app/administrativo`) | Parcial: solo frontend con datos de demostración (ver nota) |
| RF-141 | Evolución temporal de indicadores por unidad del cronograma | `administracion` · `CohortEvolutionPage` (`/app/administrativo/cohortes/:idCohorte/evolucion`) | Parcial: solo frontend con datos de demostración (ver nota) |
| RF-144 | Exportación CSV de indicadores agregados de la cohorte activa | `administracion` · `CohortExportButton` en `CohortDetailPage` | Parcial: solo demostración; endpoint y auditoría pendientes (ver nota) |
| RF-38 | Trazabilidad de la interacción conversacional (consulta administrativa) | `administracion` · `ParticipantSessionsPage`, `SessionTraceabilityPage` (`/app/administrativo/chat/participantes/:codigoParticipante/sesiones[/:idSesion/trazabilidad]`) | Parcial: integración HTTP real implementada y probada con HTTP simulado; verificación contra el backend desplegado y código A7 de M08 pendientes (ver nota) |

Nota RF-24 / RF-31 (terapia completada): un estudiante completa una sola vez cada árbol publicado (flujo y versión). Si `POST /chat/sesiones/iniciar` responde con `sesion.estado_actual = 'COMPLETADA'` (con `reanudada: false`), el backend no creó otra sesión: devuelve la sesión completada del árbol vigente con su nodo final e `historial_reciente`. `ChatEntryPage` muestra entonces «¡Has terminado tu terapia!», indica que las respuestas quedaron guardadas y que podrá comenzar otra conversación cuando se publique un nuevo árbol para su modalidad y perfil; no ofrece «Comenzar» ni «Continuar», solo «Ver conversación» (consulta de solo lectura en `ChatConversationPage`) y «Volver al inicio». El estado `COMPLETADA` prevalece sobre `reanudada`.

Nota RF-37 (errores de la conversación; ajusta RF-27 y RF-32): el frontend del chat presenta los errores que decide el backend (ADR-0004) y permite retomar la conversación desde un estado seguro sin perder las respuestas registradas.

- **Manejo de errores:** los errores HTTP de la conversación se normalizan con `toApiError` (`{ status, codigo, mensaje, campo, reintentable }`) y los de `POST /chat/sesiones/iniciar` con `toChatApiError`; se decide por `codigo` y estado HTTP, nunca por el texto. Se muestra el `mensaje` seguro del backend; los únicos textos propios son los de ADR-0004 D2 (sin conexión y respuesta sin mensaje). Solo la falta de respuesta y los 5xx son reintentables; ningún 409 lo es. Nunca se muestran trazas, SQL, rutas internas ni otros detalles técnicos. Cada petición de la conversación (inicio, nodo actual, historial, respuestas y reporte de errores) envía un `X-Request-Id` generado en el cliente, y el error conserva `requestId`: el que devolvió el servidor o, si no hubo respuesta, el enviado. `toChatApiError` no trata un error HTTP ya normalizado como falta de conexión. `CHAT_ERROR_CODE` incorpora los códigos del filtro conversacional del backend (entre ellos `ESTADO_INCONSISTENTE`, `RECURSO_NO_DISPONIBLE` y `LIMITE_REPORTES`). Los demás módulos que comparten `apiClient` no cambian: `requestId` solo se agrega cuando existe.
- **Límite de errores (ErrorBoundary):** `ChatErrorBoundary` envuelve `ChatConversationPage`. Un error inesperado al presentar la conversación no derriba la aplicación: se muestra «Ocurrió un error inesperado. Inténtalo de nuevo.» y «Tus respuestas guardadas no se perdieron.», con «Reintentar» (vuelve a montar la conversación, que se recarga desde el servidor) y «Volver al chat». No se muestra ni se envía el detalle técnico. Los errores de las peticiones HTTP no llegan a este límite: los tratan el hook y los servicios.
- **Respuestas inválidas:** en el mismo nodo se cuentan las respuestas rechazadas por validación del backend (HTTP 400, salvo `TIPO_ENTRADA_NO_PERMITIDO`), una sola vez por `id_interaccion`; no cuentan los errores de red, los 409 ni los 5xx. Al tercer rechazo consecutivo se muestra «Parece que estás teniendo dificultades con esta pregunta. Si lo necesitas, puedes pedir ayuda para continuar.» con el botón «Pedir ayuda». El contador se reinicia cuando se acepta una respuesta o cambia el nodo. La respuesta sigue editable, el historial se conserva y la pregunta no se omite («Omitir nodo» sigue pendiente en A5). Como no existe un flujo de ayuda para el estudiante, «Pedir ayuda» solo muestra una orientación para contactar al equipo de psicología, sin rutas ni endpoints propios; la integración real con RF-43 (SOS) sigue pendiente.
- **Recursos multimedia:** se conserva RF-33. Un recurso que no carga provoca una única recarga del nodo para obtener URL nuevas; si sigue sin cargarse, se marca como no disponible, el resto de la conversación continúa y su `idRecurso` viaja en `recursos_no_presentados` del siguiente envío. Un `503 RECURSO_NO_DISPONIBLE` al cargar el nodo muestra el mensaje del backend con «Reintentar» manual. La recuperación de un recurso nunca reenvía una respuesta, y un POST de respuesta cuyo resultado es incierto no se reenvía automáticamente: el reintento es manual y reutiliza el mismo `id_interaccion`.
- **Registro de errores del cliente:** `POST /chat/errores-cliente` (cookie y `X-CSRF-Token`) se usa solo para lo que el backend no puede registrar: `ERROR_PRESENTACION` (desde `ChatErrorBoundary`), `RECURSO_NO_DISPONIBLE` (recurso que sigue sin mostrarse tras el reintento) y `SIN_CONEXION`. El cuerpo lleva solo `codigo` e `id_sesion` (si es un UUID): nunca trazas, mensajes, respuestas del estudiante ni URL. Los errores HTTP no se vuelven a reportar porque el backend ya los registra. Es una operación secundaria: nunca lanza ni bloquea la conversación, y un fallo del propio reporte no se reporta. Límite propio: un mismo código por sesión una vez por minuto, como máximo 5 reportes por minuto (el backend admite 10) y una pausa de un minuto tras un 429.
- **Recuperación ante 409:** ante un 409 `NODO_DESACTUALIZADO` o `ESTADO_INCONSISTENTE` en una conversación en curso, la respuesta pendiente se descarta (no se repite) y el último estado válido se pide a `POST /chat/sesiones/iniciar`, como en RF-32: se reemplazan el nodo actual, el hilo (`historial_reciente`) y la secuencia (`ultima_secuencia`), sin duplicar mensajes, y el `mensaje` del backend queda como aviso informativo. El cliente no decide cuál fue el último nodo válido. Hay una sola recuperación automática hasta la siguiente respuesta aceptada: si /iniciar falla, se muestra su error y «Reintentar» consulta por GET; un segundo `NODO_DESACTUALIZADO` en ese intervalo se resincroniza por GET y un segundo `ESTADO_INCONSISTENTE` se muestra con «Volver al chat». Si /iniciar entrega otra sesión, se abre esa; si entrega una `COMPLETADA`, queda en solo lectura. Esto sustituye, para esos dos códigos, el comportamiento 8, CA-27-9 y el estado «`NODO_DESACTUALIZADO`: recargar el nodo actual» de RF-27, y el comportamiento 7 de RF-32. `SECUENCIA_FUERA_DE_ORDEN`, `NODO_TERMINAL` y `SESION_NO_ACTIVA` siguen resincronizándose por GET (nodo actual e historial); los demás 409 conservan su tratamiento.
- **Limitaciones:** sin conexión el reporte no puede llegar: solo un `SIN_CONEXION` queda pendiente en memoria y se intenta una vez cuando vuelve la red; si antes se cierra la pestaña, se pierde, y los demás códigos se descartan. No hay garantía de entrega. La conexión entre el hook y sus efectos (llamada a /iniciar y envío de reportes) no tiene pruebas automatizadas porque el proyecto no usa Testing Library; las pruebas cubren, con mocks, el reducer, los servicios, la capa de API y los componentes. No se ejecutaron pruebas de integración contra el backend ni se verificó el registro en `chat.registro_errores`: deben hacerse con una base aislada. El umbral de tres rechazos no está definido en el contrato del backend («por definir») y debe confirmarse con el equipo.

Nota RF-39 (evento de sesión finalizada hacia M05; RF-39 v2.0, estado «Pendiente» en la especificación): RF-39 es una integración interna del backend. Al finalizar una sesión con interacciones válidas, Chat emite el evento asíncrono `CHAT_SESION_FINALIZADA` hacia M05 por `chat.sesion-finalizada`, sin bloquear al estudiante ni mostrarle nada. El frontend no emite ni espera el evento y no tiene endpoint para ello.

- **Backend (Leandro, revisado por lectura de código en `develop`):** la migración `20261121001000_chat_eventos_seguimiento_rf39` crea el outbox `chat.eventos_seguimiento` (estados `ENCOLADO`, `ENTREGADO`, `ERROR_REINTENTO`; orígenes `CIERRE_SESION`, `SINCRONIZACION_OFFLINE`) y el trigger `trg_evento_sesion_finalizada`, que inserta el evento en la misma transacción que pasa `estado_sesiones` a `COMPLETADA`, solo si existe una respuesta válida. La restricción `UNIQUE (id_sesion, origen_evento)` con `ON CONFLICT DO NOTHING` evita duplicados. Un `CHECK` exige dimensiones clínicas `null` en GRUPAL y completas en PERSONALIZADA, y la modalidad y las dimensiones se toman de la sesión cerrada. `BullMqEventosSeguimientoWorker` revisa el outbox cada 200 ms, publica en BullMQ (`jobId = id_evento`, reintentos y backoff exponencial configurables), entrega a M05 con `EventEmitter2` y marca `ENTREGADO` solo tras la confirmación; si no hay listener o falla, marca `ERROR_REINTENTO` y vuelve a ofrecer el evento tras `CHAT_SEGUIMIENTO_REENCOLAR_MS`. Sin `CHAT_SEGUIMIENTO_REDIS_URL` los eventos quedan en PostgreSQL. Contrato: `application/ports/evento-sesion-finalizada.ts` (versión `1.0`, `timestamp` ISO 8601 UTC) y `docs/CONTRATO_RF39_EVENTO_SESION_FINALIZADA.md`.
- **Frontend (comportamiento existente, sin cambios en RF-39):** la respuesta del `POST` de respuestas con `estado_sesion: COMPLETADA`, o un nodo terminal, lleva la conversación al estado `COMPLETADA` (RF-31): se muestra «¡Has terminado tu terapia!», no hay formulario, `ENVIAR` se ignora y el historial se conserva. El cierre no depende de M05. Pruebas unitarias con mocks en `conversationState.test.js`, `SesionCompletada.test.jsx` y `ChatEntryPage.test.jsx`.
- **Integración pendiente de validación:** no se ejecutó ninguna prueba con PostgreSQL, Redis ni M05, y no se midió la entrega en menos de 500 ms. Las pruebas del backend (`test/chat/evento-sesion-finalizada-rf39.e2e-spec.ts`) requieren una base desechable `brisa_rf39_*` y un Redis aislado, y hoy no compilan con la firma vigente de `ProcesarRespuestaUseCase` (piden 4 dependencias y la prueba pasa 2). En el repositorio no existe un módulo M05 con listener para `chat.sesion-finalizada`, así que los eventos no pueden entregarse y se reintentan indefinidamente. La emisión con origen `SINCRONIZACION_OFFLINE` depende de RF-35, la verificación del etiquetado de RF-36 queda pendiente y el outbox no registra el número de reintentos que pide la trazabilidad del RF.

Nota RF-39B (perfil clínico vigente para M05; RF-39B v1.0.1, estado «Pendiente» en la especificación): RF-39B es una consulta interna del monolito, sin ruta HTTP. M05 importa `ChatModule` e inyecta `PerfilClinicoVigentePort`, cuya operación `obtener(idUsuario)` devuelve `{ id_usuario, tipo_dependencia, tipo_craving, modalidad_terapeutica_activa, estado_perfil_clinico, fecha_clasificacion, fuente_clasificacion }` en cualquier momento, sin depender del evento de RF-39. No tiene responsabilidad de frontend.

- **Backend (Leandro, revisado por lectura de código en `develop`):** `ChatModule` registra y exporta el puerto (`application/ports/perfil-clinico-vigente.port.ts`) con el adaptador `PrismaPerfilClinicoVigenteAdapter`, que lee `chat.v_perfil_clinico_vigente` (migración `20261120235000_chat_perfil_clinico_vigente_rf39b`). La vista toma la modalidad de la asignación vigente de `chat.tipo_terapia` y el perfil de `chat.perfil_clinico`; calcula `PENDIENTE_PERFIL` con `COALESCE` sin añadirlo a los enums de PostgreSQL; usa `ACTIVO` con ambas dimensiones, `PENDIENTE` si falta alguna y hay una sesión activa o una captura parcial, y `NO_CLASIFICADO` en otro caso; `fecha_clasificacion` es la última actualización del perfil (o `null` sin dimensiones) y `fuente_clasificacion` es `CHAT`. Solo incluye estudiantes con registro completo y al menos una sesión `ACTIVA` o `COMPLETADA`, y es `security_invoker` con los permisos públicos revocados. Errores de dominio: `SIN_SESION_CONVERSACIONAL` (equivale a 422) si el estudiante no aparece en la vista y `VALOR_CLINICO_INVALIDO` (equivale a 400) ante valores fuera de catálogo o sin modalidad vigente. Contrato: `docs/CONTRATO_RF39B_PERFIL_CLINICO_VIGENTE.md`.
- **Integración (Juan Esteban, validada en ejecución sin base de datos):** `test/chat/perfil-clinico-vigente-consumidor.e2e-spec.ts` simula a M05 con la inyección real de NestJS y el adaptador real, sustituyendo solo `PrismaService` por filas con la forma de la vista. Comprueba que un módulo externo que importa `ChatModule` recibe el adaptador real y que sin esa importación el puerto no se resuelve; que se consulta la vista con el UUID como parámetro; los escenarios GRUPAL sin perfil, perfil completo y PERSONALIZADA; y los dos errores de dominio (10 de 10 superadas). Esta prueba no verifica la vista SQL.
- **Pendiente de validación:** el e2e de Leandro (`test/chat/perfil-clinico-vigente.e2e-spec.ts`, 6 pruebas), que verifica la vista contra PostgreSQL, no se ejecutó porque requiere una base local desechable `brisa_rf39b_*`. En el repositorio no existe un módulo M05 que consuma el puerto. Diferencias con la especificación por confirmar con el equipo: las sesiones `PAUSADA` no cuentan como sesión disponible, la falta de modalidad vigente produce `VALOR_CLINICO_INVALIDO` en lugar de un perfil pendiente con HTTP 200, y `fuente_clasificacion` solo admite `CHAT`.

Nota M08 Etapa 2 (común a RF-132, RF-133, RF-134, RF-140, RF-141 y RF-144; rama `feat/m08-etapa2-admin-juan`): implementación exclusivamente frontend, sin HTTP ni integración con M05, M06, M07 o el backend. Las seis funcionalidades son consultas de solo lectura sobre agregados de cohorte; ninguna muestra datos individuales.

- **Patrón común:** página (o componente) → hook → fachada en `data/` → fuente de demostración cargada con `import()` dinámico solo si `import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true'` → servicio puro de interpretación. Sin el modo demostración el estado es «Integración pendiente»: no se consulta nada ni se muestran datos sustitutos. Cada RF tiene su variable de escenario (`VITE_M08_AGGREGATE_SCENARIO`, `VITE_M08_NARRATIVE_AGGREGATE_SCENARIO`, `VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO`, `VITE_M08_DASHBOARD_SCENARIO`, `VITE_M08_EVOLUTION_SCENARIO`, `VITE_M08_EXPORT_SCENARIO`), independiente de las ya existentes. Pruebas estáticas y la revisión de `dist/` confirman que ningún dato ficticio llega al build de producción.
- **Envoltura común RF-78:** `services/aggregateViewEnvelope.js` resuelve para RF-132, RF-133 y RF-134 el aislamiento por cohorte (una respuesta de otra cohorte no deja datos), la situación de la vista según `estado` y `motivo_sin_datos` (disponible, desactualizada, sin consolidar, suprimida, no disponible, error) y la fecha. Cada vista aplica después su propia lista explícita de campos. Ningún valor se calcula, redondea ni convierte a porcentaje; un dato ausente es «No disponible», nunca 0. «Sin consolidar» es un estado funcional, no un error.
- **Cohorte consultada:** RF-132, RF-133, RF-134 y RF-141 se consultan por cohorte (rutas `/cohortes/:idCohorte/...`, enlazadas desde el detalle de la cohorte), mientras el Excel habla de la «cohorte activa». RF-140 y RF-144 sí exigen la cohorte en estado ACTIVA. Por confirmar si las vistas deben limitarse a la cohorte activa.
- **Navegación:** ninguna funcionalidad añade entradas al menú; las rutas nuevas mantienen «Cohortes» como sección activa y las guardas de RF-122. El detalle de la cohorte agrupa en «Vistas de la cohorte» los accesos a RF-142, RF-132, RF-133, RF-134 y RF-141 (1, 2 o 5 columnas según el ancho) y debajo la exportación de RF-144.
- **Datos de demostración coherentes:** los mocks de la Cohorte Piloto B están alineados entre sí: 22 participantes asignados en RF-125 (18 activos, 3 pendientes de validación, 1 inactivo), los 18 activos de RF-132, la distribución narrativa de RF-133 que suma 18 y las series de RF-141 cuya última unidad coincide con RF-132. Los activos `PART-0015` a `PART-0030` tienen además referencia, perfil e historial de seguimiento (RF-142, RF-128, RF-129) con valores fijos. `data/demoFixtureCoherence.test.js` vigila esta coherencia. Quedan sin alinear, a propósito: la Cohorte Piloto C (2 participantes inactivos en RF-125 frente a 11 activos en RF-132) y las alertas de B (RF-132 informa 2 de inactividad y 1 de craving; el seguimiento individual suma 2 y 2).
- **Pendiente con el backend:** rutas de los recursos, códigos de error (403, 404, 422, 503) y su forma, y los adaptadores de `api/`. La revisión visual en navegador (390, 800, 1280 y 1440 px) no se ha hecho y queda para el equipo.

Nota RF-132 (vista agregada conductual; contrato de referencia con `estado`, `estado_agregacion`, `ultimo_timestamp_disponible`, `motivo_sin_datos`, `mensaje` y `datos`): muestra, en este orden, alertas pendientes de inactividad y de craving, participantes activos y adherencia promedio, y la distribución por nivel de progreso de RF-70, con los campos de RF-78. Una vista desactualizada se marca y conserva su fecha; sin vista anterior se muestra «no disponible» con reintento.

- **Decisiones:** la escala de `tasa_adherencia_promedio` no está definida, así que se muestra el valor original con todos sus decimales, sin porcentaje ni indicador gráfico. Los nombres de cada elemento de la distribución (`nivel`, `total_usuarios`) son provisionales porque RF-78 no los define. `AGREGADO_SUPRIMIDO` solo se presenta cuando la fuente lo declara: el umbral N < 5 no está aprobado y queda pendiente de confirmar con Psicología.
- **Pendiente:** la rama `feat/m08-etapa2-cohortes-avanzadas` (commit `538d9d3`, sin fusionar) contiene una versión anterior de RF-132 sobre `/cohorte-activa` con otro contrato; esta implementación la sustituye y conviene no fusionar ambas.

Nota RF-133 (vista agregada narrativa; contrato de referencia `GET /admin/cohortes/{id_cohorte}/vistas/narrativa`, no consultado): muestra la distribución por fase (INICIO, DESARROLLO, CIERRE, siempre en ese orden), usuarios con el programa completado, usuarios con al menos un logro y total de logros desbloqueados. Una fase que no llega aparece como «No disponible» y una fase desconocida se ignora. El `mensaje` de M06 (por ejemplo, usuarios sin perfil narrativo excluidos) se muestra como aviso sin bloquear los datos.

- **Diferencias con el Excel:** RF-133 y RF-117 definen `total_usuarios_cohorte` y RF-117 `fecha_actualizacion`, que el contrato de referencia no trae. Se muestran si llegan y su valor no se inventa; la fecha se toma de `ultimo_timestamp_disponible` cuando `fecha_actualizacion` falta.

Nota RF-134 (vista agregada de notificaciones; contrato de referencia `GET /admin/cohortes/{id_cohorte}/vistas/notificaciones`, no consultado): muestra tasa de apertura promedio, tasa de conversión promedio y notificaciones enviadas, entregadas y descartadas. Las tasas son proporciones (RF-100: abiertas/entregadas y sesiones/abiertas): se muestran con su valor original entre 0 y 1, sin convertir a porcentaje. Una tasa `null` o `NO_CALCULABLE` es «No disponible»; cero envíos con tasas nulas es un estado válido, distinto de «sin consolidar».

- **Aclaración pendiente:** RF-134 define «descartadas» como no entregadas (fallidas, expiradas o canceladas), mientras RF-98, RF-100 y RF-101 las definen como interacciones DESCARTADA sobre notificaciones entregadas, sin canceladas ni expiradas. La interfaz sigue la segunda definición (en el panel RF-140 lo aclara su texto de ayuda) y el Excel debe unificarse con M07.

Nota RF-140 (panel principal de la cohorte activa): es la primera sección del Dashboard administrativo existente, sin ruta ni menú nuevos. Como las features no se importan entre sí, `PsychologyHomePage` (feature `users`) recibe el panel como propiedad `cohortDashboard` desde `app/router`. Se conservan, debajo, «Indicadores del programa» (consulta real `/usuarios/estadisticas-programa`, ajena a RF-140) y «Accesos de gestión».

- **Orquestación:** `services/cohortDashboard.js` identifica la única cohorte ACTIVA (nunca una BORRADOR o INACTIVA; con varias activas no elige ninguna y lo informa, porque RF-124 no define una regla) y consulta RF-132, RF-133 y RF-134 en paralelo con `Promise.allSettled`, cada una con su tiempo límite de 8 s (el Excel no fija uno), su resultado y su reintento. Un fallo de una vista no afecta a las demás y cada sección tiene su propio `SectionErrorBoundary`.
- **Alertas críticas:** `total_alertas_criticas_pendientes` es la única cifra calculada, como suma de las alertas de inactividad y craving de RF-132; si falta cualquiera de las dos se muestra «No disponible», nunca 0, y si RF-132 está desactualizada el total también se marca.
- **Caché:** en memoria y por cohorte, guarda la última vista válida de cada sección. Solo se usa si ninguna fuente responde y siempre se marca como desactualizada; sin caché se muestra el mensaje oficial de indisponibilidad. La estrategia productiva de caché corresponde al backend.
- **Presentación:** widgets compactos (barras para las distribuciones y anillos sobre la escala 0 a 1 para las tasas, siempre con el valor original visible). La adherencia no lleva indicador gráfico porque su escala no está confirmada. Animaciones solo de entrada, desactivadas con `prefers-reduced-motion`.
- **Pendiente:** los accesos que pide RF-140 hacia RF-135, RF-143 y RF-136 a RF-139 no existen todavía y no se muestran.

Nota RF-141 (evolución temporal; RF-141 v1.0.1): tres gráficos propios (SVG y HTML, sin librerías) de adherencia promedio, distribución de niveles de progreso y craving promedio por unidad del cronograma (RF-55), nunca por fecha. Cada indicador tiene su propio eje, ajustado a los valores recibidos; no hay escalas clínicas, porcentajes, umbrales ni interpolación.

- **Unidades:** M08 no tiene un catálogo de unidades, así que existe un puerto propio (`getScheduleUnits`) con un catálogo simulado explícito (`id_unidad_temporal`, `etiqueta`, `orden`). El orden y la etiqueta salen del catálogo, nunca del UUID. La serie se valida y no se reordena: longitudes distintas, unidades repetidas o fuera del catálogo, unidades intermedias omitidas, un orden distinto del cronograma o una unidad insuficiente con valores producen el error 500 sin gráficos.
- **Vacíos:** una unidad sin datos conserva su posición, se marca «Sin datos» y no se une con línea a sus vecinas; `null` nunca se muestra como 0 y una distribución ausente no equivale a ceros.
- **Estados:** menos de dos unidades es un estado funcional con el mensaje oficial; filtros sin resultados conserva visibles los filtros; 404, 403, 503 y 500 usan los mensajes oficiales. Con 503 no hay caché parcial, a diferencia de RF-140. El catálogo y la serie se piden juntos y, si cualquiera falla, no se presenta nada.
- **RF-135:** no existe. La fachada y el hook aceptan `filters` y los reenvían a la fuente sin filtrar en el navegador ni guardarlos; los nombres de `filtros_aplicados` son provisionales. Pendiente con el backend: origen real del catálogo de unidades y si llega junto con la serie.

Nota RF-144 (exportación CSV): el botón «Exportar indicadores CSV» del detalle de la cohorte genera, en modo demostración, un archivo real `indicadores_cohorte_activa_YYYYMMDD.csv` (fecha de Colombia) a partir de las mismas fachadas e intérpretes que RF-132 y RF-134. Fuera del modo demostración el botón queda deshabilitado como integración pendiente y no se genera ningún CSV local.

- **Formato:** una fila de encabezado y una de datos con 18 columnas de lista blanca en orden fijo (nombre de la cohorte, estado y fecha de cada vista, indicadores de RF-132 y de RF-134). Sigue RFC 4180 (coma, CRLF, comillas duplicadas), UTF-8 con BOM, números con punto decimal y sin redondeo, y neutralización de textos que empiezan por `=`, `+`, `-`, `@` o tabulador. La proyección lee cada columna de un campo conocido: no usa `Object.keys` ni propagación de propiedades.
- **Datos faltantes:** RF-132 es obligatorio (sin consolidar: 422 de FA3; con error: 500 de FA5). Si RF-134 no está disponible se exporta igualmente, con su estado `NO_DISPONIBLE` y sus valores «No disponible». Una vista desactualizada se exporta indicándolo en su columna de estado. La cohorte debe estar ACTIVA (422 de FA2). FA1 usa el 403 oficial.
- **Auditoría y FA4:** en la demostración, la auditoría es simulada: si falla, la descarga se bloquea, pero no persiste nada y no cumple RF-123. Pedir `include_pii` o inyectar campos personales no cambia el CSV.
- **Pendiente con el backend:** `GET /admin/cohortes/:id/exportacion.csv` con DTO de lista blanca (el frontend no debe ver datos crudos), auditoría síncrona previa al envío con usuario, sesión, IP, cohorte, estado, nombre y tamaño del archivo (también para intentos fallidos y denegados), respuesta 200 con CSV sanitizado y alerta en logs ante FA4, y confirmar el tipo del identificador de la cohorte (Integer en el Excel, UUID en el sistema).

Nota RF-38 (trazabilidad administrativa de sesiones del chat; rama `feat/m03-rf38-trazabilidad-frontend-juan`; contrato del backend `Brisa-Backend/docs/CONTRATO_HU_TRAZABILIDAD_SESION.md`, PR #74, versión de la rama `feat/m03-rf38-trazabilidad-admin-juan`): interfaz de M08 para que Psicología consulte, en solo lectura, las sesiones conversacionales de un participante y la trazabilidad de cada una. Es la primera integración HTTP real del M08: no usa fuentes de demostración ni sustituye errores por datos ficticios.

- **Rutas:** `/app/administrativo/chat/participantes/:codigoParticipante/sesiones` (`ParticipantSessionsPage`) y `/app/administrativo/chat/participantes/:codigoParticipante/sesiones/:idSesion/trazabilidad` (`SessionTraceabilityPage`), dentro de `RequireAuth(ADMINISTRATIVO)` → `AdminLayout`. La sección activa del menú es «Chat». Los enlaces se construyen con `utils/chatTraceabilityRoutes.js`, que valida el código A7 y el UUID; con un identificador inválido no hay enlace.
- **Consumo HTTP** (`api/chatTraceability/`, `apiClient` con cookie y `toApiError`):
  - `GET /chat/admin/participantes/{codigo}/sesiones` con `limite=20` y `cursor`. El cursor se envía tal cual, sin decodificarlo.
  - `GET /chat/admin/sesiones/{id}/trazabilidad?codigo_participante=…`, siempre con el código, para que el backend compruebe la pertenencia de la sesión.
  - Solo GET. No hay `X-Request-Id`, porque el generador vive en la feature `chat` y las features no se importan entre sí.
  - La auditoría RF-123 la hace el backend; el frontend no la duplica.
- **Validación y normalización** (servicios puros):
  - `participantSessionsResponse.js` y `sessionTraceResponse.js` aplican listas explícitas de campos.
  - Comprueban que `id_participante` (y `id_sesion` en la trazabilidad) sean los pedidos; si no, el estado es `MISMATCH` y no se muestra nada.
  - Una estructura inválida o una secuencia repetida dan `INVALID_RESPONSE`, sin datos parciales.
  - `total` no se confunde con los elementos cargados, y las sesiones SOS se conservan.
  - Los registros se ordenan por `secuencia` ascendente.
  - Solo un registro `VERIFICADO` sin motivo conserva `tipo_nodo`, `texto_nodo` y `etiqueta_respuesta`. Un `NO_VERIFICABLE`, o un valor desconocido, los descarta aunque lleguen.
- **Presentación:**
  - **Listado:** tarjetas con modalidad y estado (texto, ícono y color) y fechas en hora de Colombia dentro de `<time>`. El UUID es secundario. Muestra «Mostrando N de total» y «Cargar más sesiones» mientras haya `siguiente_cursor`.
  - **Trazabilidad:** línea de tiempo vertical (`<ol>`) con:
    - número de interacción y fecha;
    - contenido verificado con su texto exacto, o una advertencia con el motivo traducido y su código, sin texto;
    - tipo de entrada y valor registrado sin modificar (texto, número, booleano, lista, objeto como JSON, o `null`);
    - etiquetas como explicación adicional;
    - `CONTINUAR` con `null` presentado como avance sin respuesta;
    - «Fin del flujo conversacional» si `id_nodo_destino` es `null`;
    - datos técnicos plegados.
  - Todo se pinta como texto con React, sin `dangerouslySetInnerHTML`.
- **Errores** (por estado HTTP y `codigo`, nunca por texto; ADR-0004):

  | Estado HTTP | Comportamiento |
  | --- | --- |
  | 400 | Solicitud no válida |
  | 401 | Redirige a `/login`, como el chat |
  | 403 | Acceso denegado |
  | 404 `PARTICIPANTE_NO_ENCONTRADO` | Participante no encontrado |
  | 404 `SESION_NO_ENCONTRADA` | Sesión no encontrada o no vinculada |
  | 422 `HISTORIAL_INCONSISTENTE` | Historial no mostrado |
  | 5xx | Consulta no disponible |
  | Sin conexión | Texto D2 |

  - Se muestra el `mensaje` del backend si llega. «Reintentar» solo aparece sin respuesta, ante un 5xx o una respuesta inválida, y siempre por acción del usuario.
  - Un 401 o 403 al cargar más bloquea también lo ya mostrado. Otro error conserva lo cargado y ofrece reintento.
- **Privacidad:**
  - **Sin persistencia:** nada se guarda en `localStorage`, `sessionStorage` ni IndexedDB, no hay `console`, la URL lleva solo el código A7 y el UUID, y no hay precarga de otras sesiones.
  - **Peticiones canceladas:** cada página se vuelve a montar por participante y sesión, cancela su petición (`AbortController`) y descarta respuestas tardías.
  - **PWA:** sin `runtimeCaching`, solo precachea el app shell (C-PWA-2), y el backend responde `no-store`.
  - **Sin escritura ni descarga:** no hay edición, eliminación, reenvío, descarga ni exportación.
- **Dependencia del código A7 (M08):**
  - Ninguna fuente real de M08 entrega hoy el código A7 auténtico. La ficha RF-128 está en «integración pendiente» y su demostración usa códigos ficticios `PART-XXXX`.
  - La referencia `seg-…` de la ruta es opaca y no se convierte en código.
  - `ParticipantSessionsLink` en la ficha solo aparece con un participante confirmado, una fuente real (ni demostración ni integración pendiente) y un código con formato `P-` y 8 hexadecimales. Hoy no se muestra en ningún modo.
  - **Lo que debe suministrar la fuente real de la ficha:** el campo `code` con el seudónimo A7 de `administrativo.seudonimos_participante` del mismo participante consultado, autorizado y aislado como el resto de la ficha. Hasta entonces, las páginas solo son accesibles escribiendo la ruta con un código A7.
- **RF-148:** `readOnlyRestriction.guard.test.jsx` sustituye la invariante temporal «el M08 aún no hace ninguna petición HTTP» por una lista explícita de adaptadores permitidos, como preveía. Solo están los dos de RF-38: en `api/`, solo `apiClient.get` y hacia `/chat/admin/`. Las reglas permanentes contra escrituras siguen vigentes, y `utils/chatTraceabilityRoutes.js` se declara como referencia de consulta.
- **Estado:**
  - **Implementado:** lo anterior.
  - **Verificado con pruebas automatizadas** (Vitest en `node`, HTTP simulado): servicios, adaptadores, hooks (paginación, cancelación, respuestas tardías, reintento), páginas, línea de tiempo, enlace de la ficha y rutas protegidas.
  - **Pendiente:** integración real contra el backend desplegado con una sesión administrativa de prueba (no se ejecutó: el PR #74 no está integrado y no había un ambiente autorizado), revisión visual en navegador (360, 768, 1024 y 1440 px) y fuente auténtica del código A7.
  - **Limitaciones:** al volver de la trazabilidad, el listado se vuelve a pedir desde la primera página. Las interacciones de teclado y foco no tienen prueba automática (ADR-0002).

Nota RF-43 (botón SOS «Tengo ganas de vapear», MVP; rama `feat/m03-rf43-sos-craving-juan`; contrato del backend `Brisa-Backend/docs/CONTRATO_RF43_SOS_CRAVING.md`, estado BORRADOR, rama `develop`): el estudiante abre con un toque una intervención breve de autorregulación. El backend fija el límite, decide el estado final y registra la duración.

- **Botón global:** `components/SosButton` se monta una sola vez en `StudentLayout`. Por eso solo existe bajo la guarda `ESTUDIANTE`: nunca aparece para administrativos ni sin sesión.
  - En móvil flota sobre la barra inferior sin taparla, y `main` reserva su alto para no cubrir el final de la página.
  - Lleva el texto visible «Tengo ganas de vapear», ícono `LifeBuoy` y foco visible.
  - No se muestra dentro de `/app/estudiante/sos`.
  - Un toque, sin confirmación: el `POST /chat/sos/activar` sale en el mismo evento y la pantalla SOS se abre de inmediato en estado «Abriendo…».
  - El doble toque se bloquea con un candado síncrono y con el almacén `services/sos/intervencionSosActual.js`, que guarda una intervención por pestaña y solo en memoria. Con una intervención en curso, otro toque vuelve a ella sin activar otra.
  - Al desmontarse el layout (cierre de sesión) la intervención se descarta.
- **Apariencia y arrastre del botón:** el botón es rojo (`#C62828`, tokens `--sos-*` en `tokens.css`), con texto e ícono blancos (5,6:1) y estados de hover, active, foco y deshabilitado. No cambia la paleta de los demás botones.
  - Se arrastra con Pointer Events (mouse, toque y lápiz). Un desplazamiento de menos de 8 px es un toque y activa el SOS; uno mayor es un arrastre que mueve el botón y anula el `click` que le sigue.
  - Al soltarlo se ajusta al borde horizontal más cercano.
  - Queda siempre dentro de la pantalla, sin tapar el encabezado ni la barra inferior móvil (`data-sos-limite`) y respetando las áreas seguras.
  - La posición se recalcula al cambiar el tamaño o la orientación de la pantalla y se conserva en memoria al navegar.
  - Con el teclado, las flechas lo mueven; Enter y Espacio siguen activándolo.
  - Por debajo de 340 px el texto queda solo para el lector de pantalla.
  - Lógica pura en `components/SosButton/posicionSosButton.js`; medición del DOM en `useSosButtonPosition.js`.
- **Contexto de origen:** `services/sos/contextoOrigenSos.js` arma `{ modulo, ruta, estado: null }`.
  - `modulo` se deduce de la ruta (`CHAT`, `CONTENIDO`, `CRONOGRAMA`, `DIARIO`, `PERFIL` u `OTRO`).
  - `ruta` es la ruta interna con su consulta, sin fragmento.
  - `estado` va siempre `null`: ninguna pantalla del estudiante expone hoy un estado restaurable (borradores, paso o desplazamiento). Restaurarlo exigiría cambios en otros módulos, fuera del alcance.
  - Nunca se envían respuestas, datos personales ni tokens.
- **Intervención:** `services/sos/controladorSos.js` es una máquina de estados sin React, con la API y el reloj inyectables. La página `SosInterventionPage` solo se suscribe a ella.
  - Reutiliza `ChatNodeMessage`, `NodeInputForm`, `crearCuerpo` (cuerpo RF-30 completo: `id_interaccion`, `secuencia`, `tipo_entrada`, `valor`, hora y conectividad), `mapNodoActual`, `enviarRespuesta` y `obtenerNodoActual`. El motor del chat normal no cambia.
  - Tras cada respuesta se pide el nodo actual de la sesión SOS (RF-26).
- **Cuenta regresiva:** `services/sos/tiempoSos.js`. La duración sale de `fin_maximo_servidor − inicio_servidor`; el cliente nunca supone 60 s.
  - La cuenta se ancla al envío del POST: se descuenta la latencia y el tiempo mostrado nunca supera al del servidor.
  - Solo se usan duraciones, no la hora absoluta del dispositivo, así que el desfase del reloj local no influye.
  - El tiempo transcurrido es el mayor entre el reloj monotónico y el de pared. Así funciona con la pestaña oculta, con el equipo suspendido y con un cambio de hora.
  - La cuenta se recalcula cada 250 ms y al volver a la pestaña (`visibilitychange`, `pageshow` y `focus`).
  - Agotado el tiempo no se envían más respuestas y se pide el cierre `TIEMPO_AGOTADO` una sola vez.
- **Cierre obligatorio:** `POST /chat/sos/:id_intervencion/finalizar`. Se pide una sola vez por intervención.
  - Motivos: `COMPLETADA` al presentarse el nodo final, o cuando la respuesta confirma `estado_sesion: COMPLETADA` aunque el último nodo no se pueda pedir; `CERRADA_POR_USUARIO` con «Terminar el ejercicio»; `TIEMPO_AGOTADO` al agotarse la cuenta o con 409 `TIEMPO_AGOTADO` al responder.
  - Se muestran `estado` y `duracion_segundos` tal cual: el cliente no calcula ni sobrescribe la duración.
  - Con 409 `INTERVENCION_FINALIZADA` o 404 `INTERVENCION_NO_ENCONTRADA` se muestra «No pudimos confirmar cómo terminó el ejercicio.» y el mensaje del backend. No se inventa un cierre exitoso.
  - Sin conexión o con 5xx se ofrece reintentar con el mismo motivo.
  - Una respuesta que llega con la intervención ya cerrada se descarta.
- **Recursos de apoyo:** al terminar, o si falla el cierre, se muestran los `recursos_apoyo` recibidos al activar, sin agregar nombres ni números propios. Solo un número marcable lleva enlace `tel:` (con `aria-label`); `POR_CONFIRMAR` u otro texto se muestra sin enlace.
- **Retorno:** `services/sos/retornoSos.js`. Manda lo que devuelve el cierre (`contexto_retorno`, `sesion_pausada`); si no llegó, se usa lo conocido de la activación.
  - Toda ruta se valida: debe ser interna de `/app/estudiante`, sin `//`, `\`, `..` ni fragmento, y nunca la propia pantalla SOS. En otro caso se vuelve al inicio del estudiante.
  - Si el estudiante venía del chat y había una sesión pausada, se llama a `POST /chat/sesiones/iniciar` (RF-32) y se comprueba que sea la misma sesión y el mismo `id_nodo_actual`. Si coinciden, se abre con los datos en memoria (`recordarInicioSesion`); si no, se avisa antes de abrir la que entregó el backend.
  - Desde otro módulo se restaura su ruta y la sesión sigue en pausa hasta que RF-32 la retome. Sin sesión previa no se crea ninguna.
- **Errores y privacidad:** se decide por `status` y `codigo` y se muestra el `mensaje` del backend (ADR-0004).
  - Ante un 401 se redirige a `/login`.
  - 403 `CSRF_INVALIDO`, 404 `SIN_FLUJO_SOS` y 409 `INTERVENCION_EN_CURSO` se muestran sin reintento automático. El 409 explica que el ejercicio no se puede continuar en esa pestaña.
  - Sin conexión o con 5xx se puede reintentar.
  - Un 400 al responder deja el formulario editable; la siguiente respuesta lleva otro `id_interaccion`.
  - Otros conflictos al responder bloquean las respuestas y solo queda cerrar.
  - Nada se guarda en `localStorage`, `sessionStorage` ni en el historial del navegador, y no hay `console.log`. No se muestra el perfil clínico.
- **Medición (objetivo < 300 ms):** `services/sos/medicionSos.js` registra marcas de User Timing para «toque → interfaz SOS visible» (`brisa-sos:toque-a-interfaz`, medida en el siguiente cuadro con `requestAnimationFrame`) y «toque → nodo real del backend» (`brisa-sos:toque-a-nodo`). Para leerlas en DevTools: `performance.getEntriesByType('measure').filter((m) => m.name.startsWith('brisa-sos:'))`. **No se ha medido todavía en un navegador.**
- **Huecos del contrato (aclaraciones pendientes):**
  1. No hay un endpoint para recuperar una intervención en curso. Tras F5 o en otra pestaña, la activación responde 409 `INTERVENCION_EN_CURSO` solo con `id_intervencion` y `fin_maximo_servidor`, sin `id_sesion_sos`, nodo ni recursos, así que el ejercicio no se puede continuar. Termina con el cierre automático del backend (`EXPIRADA`).
  2. El 404 `SIN_FLUJO_SOS` no trae `recursos_apoyo`: en ese caso solo se muestra el mensaje del backend.
  3. Tras un fallo de red en la activación, el reintento puede recibir 409 si el primer POST sí llegó (mismo caso que 1).
  4. Si el nodo inicial del flujo ya es terminal, el cierre `COMPLETADA` queda `INCOMPLETA`: la función SQL exige que la sesión SOS esté `COMPLETADA`, y eso solo ocurre al responder.
  5. Según el contrato, hasta regenerar el cliente Prisma, `GET /chat/sesiones/:id/nodo-actual` podría no leer sesiones con `modalidad = SOS`. Hay que confirmarlo en el ambiente integrado.
  6. `/iniciar` puede devolver otra sesión o recuperar el puntero desde el historial. El frontend lo detecta y avisa, pero no puede impedir que el backend cree una sesión nueva.
  7. Si el estudiante sale de la pantalla SOS a mitad del ejercicio, la cuenta no corre fuera de ella. Al volver con el botón se cierra como `TIEMPO_AGOTADO` si ya venció, o la cierra el backend.
- **Estado:**
  - **Implementado:** lo anterior.
  - **Verificado con pruebas automatizadas** (Vitest en `node`, HTTP simulado): adaptadores, controlador (activación, RF-30, nodo final y `COMPLETADA`, cierre anticipado, expiración, latencia, desfase y suspensión, respuestas tardías, 400, 401, 404, 409 y red), almacén, retorno y reanudación, botón, página, layouts y router.
  - **Pendiente:** integración contra el backend desplegado con un estudiante de prueba. Incluye activar a mitad de sesión y recuperar el mismo nodo, completar dentro de 60 s, y cerrar hacia los 15 s comprobando `INCOMPLETA` y la duración real. También queda pendiente la medición de < 300 ms en navegador y la revisión visual (360, 768 y 1024 px).
  - **Limitaciones:** el hook de la página no tiene prueba propia (ADR-0002, sin DOM). Su lógica está en servicios probados.

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

> **Aclaración · Manejo de errores.** El frontend **no maneja excepciones propias**: se comporta como presentador de las que maneja el backend. Su responsabilidad es hacerlas **accesibles, claras y específicas** para el usuario. Reglas C-ERR-1 a C-ERR-6.

- **C-ERR-1.** **El frontend no define sus propias excepciones de negocio: presenta las que maneja el backend.** Las reglas, validaciones y rechazos (código, `message` o `mensaje`, `campo`, estado HTTP) los decide el backend; el frontend los hace **accesibles, claros y específicos** para el usuario, sin reinterpretarlos ni sustituirlos por textos inventados.
- **C-ERR-2.** Se decide por el `codigo` del backend, nunca por el texto. El mensaje del backend se muestra tal cual (puede venir en `message` o en `mensaje`; si es una lista, se unen sus partes).
- **C-ERR-3.** «Accesibles»: el error se anuncia a lectores de pantalla (`role="alert"`), se asocia a su campo cuando el backend indica `campo`, y nunca se comunica solo con color: lleva texto e ícono. «Claros y específicos»: se muestra el mensaje del caso concreto y, según corresponda, la acción posible (reintentar si el error es reintentable, iniciar sesión si es 401, volver al inicio).
- **C-ERR-4.** Los únicos textos de error que el frontend escribe son los de situaciones que el backend no puede informar porque no hay respuesta: **falta de conexión** (`SIN_CONEXION`) y **respuesta ilegible o sin mensaje** (texto genérico). No se agregan otros.
- **C-ERR-5.** Las validaciones previas del frontend (campo vacío, formato) solo ahorran un viaje al backend y siguen su regla; no sustituyen la validación del backend, que siempre prevalece.
- **C-ERR-6.** El tratamiento común vive en `shared/utils/apiError.js` (`toApiError`) y en el componente de mensaje de error compartido; cada feature lo reutiliza en lugar de repetirlo. Si el backend cambia un mensaje o un código, el frontend lo refleja sin tocar su propio texto.
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
| v0.2 | 2026-11-21 | RF-24 / RF-31: estado de entrada «terapia completada»; no se reinicia un árbol ya completado. |
| v0.3 | 2026-11-22 | RF-37: manejo de errores de la conversación (normalización y `X-Request-Id`, límite de errores, tres respuestas inválidas y «Pedir ayuda», recursos multimedia, registro de errores del cliente) y recuperación de `NODO_DESACTUALIZADO` y `ESTADO_INCONSISTENTE` con /iniciar (ajusta RF-27 y RF-32). |
| v0.4 | 2026-11-22 | RF-39: trazabilidad del evento de sesión finalizada hacia M05 (backend revisado por lectura, comportamiento frontend existente e integración pendiente de validación). |
| v0.5 | 2026-11-22 | RF-39B: trazabilidad del perfil clínico vigente para M05 (backend revisado por lectura, consumidor de prueba validado sin base de datos y verificación de la vista pendiente). |
| v0.6 | 2026-11-22 | M08 Etapa 2: notas de RF-132, RF-133, RF-134, RF-140, RF-141 y RF-144 (solo frontend con datos de demostración), filas en la matriz de trazabilidad, coherencia de los datos de la Cohorte Piloto B y pendientes de integración con el backend. |
| v0.7 | 2026-11-23 | RF-38: interfaz administrativa de trazabilidad de sesiones del chat (listado por seudónimo A7 y línea de tiempo), primera integración HTTP del M08, guarda RF-148 con lista de adaptadores permitidos y dependencia del código A7 auténtico de M08. |
| v0.8 | 2026-11-23 | RF-43: botón SOS global del estudiante, pantalla de intervención con cuenta regresiva del servidor, cierre obligatorio por motivo, recursos de apoyo, retorno a la actividad anterior y huecos del contrato. |
| v0.9 | 2026-11-23 | RF-43: botón SOS rojo con token propio y arrastrable (puntero y teclado), con ajuste al borde y límites de pantalla. |
