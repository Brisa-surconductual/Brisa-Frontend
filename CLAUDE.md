# Brisa Frontend

PWA mobile-first de apoyo psicoeducativo para la cesación del consumo de
vapeo en estudiantes universitarios. Universidad Surcolombiana · Trabajo de
grado. Este repositorio es SOLO el frontend.

---

## Stack (no cambiar sin acuerdo del equipo)

- React 19.2 + Vite 8 + JavaScript (ES2024). **NO TypeScript.**
- **React Compiler activado** (`babel-plugin-react-compiler` en `vite.config.js`).
  NO agregar `useMemo` / `useCallback` manuales salvo caso justificado; el
  compilador ya memoriza.
- Ruteo: `react-router-dom` v7.
- Estilos: **CSS Modules** (`*.module.css`) + variables de `src/styles/tokens.css`
  **NO Tailwind. NO librerías de UI externas** (MUI, Chakra, etc.).
- Iconos: **`lucide-react`** únicamente. `strokeWidth` ~1.5–1.8, `size` 20 en UI.
  **Nunca emoji** en la interfaz.
- Fuentes: Manrope (texto) e IBM Plex Mono (mono), ya importadas en `main.jsx`.

---

## Arquitectura — NO NEGOCIABLE

Feature-Based + Screaming Architecture. La estructura refleja el dominio, no
la tecnología.

```
src/
├── app/            → router, layouts, providers globales, config
├── features/       → un dominio de negocio por carpeta
│   └── <feature>/
│       ├── api/          → llamadas al backend (hoy: mocks)
│       ├── components/   → componentes SOLO de esta feature
│       ├── context/      → estado local de la feature (Context + reducer)
│       ├── hooks/        → hooks de la feature
│       ├── pages/        → vistas. Cada page: Page.jsx + hooks/ + components/ + utils/
│       ├── services/     → validaciones, transformaciones, reglas de negocio puras
│       ├── types/        → constantes y catálogos (Object.freeze)
│       ├── utils/        → helpers de la feature
│       └── index.js      → barril de exportación
├── shared/         → reutilizable por 2+ features (ui/, brand/, utils/)
└── styles/         → tokens.css, globals.css
```

Reglas duras:

- **Las features NO se importan entre sí.** Si dos features necesitan algo, va a `shared/`.
- Un componente solo sube a `shared/` cuando lo usan **2 o más** features.
- **Toda** comunicación con el backend vive en `features/<feature>/api/`. Ningún
  `fetch` fuera de ahí.
- Los errores de API se lanzan **tipados** con `code` (ver
  `features/users/api/registration/registrationApiUtils.js` como referencia:
  `createApiError`, `simulateNetworkDelay`).

---

## Convenciones de código (imitar `features/users`, ya establecidas)

- **Página delgada:** el `*.jsx` de una página solo compone y pinta. Todo el
  estado y la lógica van en `hooks/use<Page>.js`. Copiar el patrón de
  `CreateAccountPage.jsx` + `useCreateAccountPage.js`.
- Validación → `services/`. Estado del formulario y helpers de foco → `utils/`.
- Nombres de archivos y componentes en inglés (`CreateAccountPage`,
  `useBaselineForm`). Textos visibles al usuario en **español**.
- Cada carpeta de componente/página tiene su `index.js` que reexporta.
- Imports agrupados y separados por línea en blanco: librerías → shared →
  feature → relativos → estilos. Respetar el ancho angosto de línea del repo.
- `Object.freeze` para constantes y catálogos.
- Comentarios explicativos en español cuando aclaran una regla de negocio.

---

## Design system (fuente de verdad: `docs/Design_System_prototipo_v1.2.html`)

- Usar SIEMPRE variables de `tokens.css`. **Nunca** hardcodear colores ni
  espaciados. Espaciado: `--s1`..`--s10`. Radios: `--r-sm/md/lg/xl/full`.
- `--brand-*` es identidad. `--accent-*` está RESERVADO para gamificación (M06):
  no usarlo en M01.
- Estados semánticos: `--success / --warning / --danger / --info` (cada uno con
  `-bg`, `-text`, `-border`). El color solo nunca comunica estado: acompañar
  siempre con texto/ícono.
- Contraste mínimo WCAG AA **4.5:1**. Todo input con error muestra mensaje de
  texto, no solo borde rojo.
- Mobile-first, una columna. Marco de referencia 360px.

---

## Reglas de dominio (M01 — Gestión de usuario)

Fuente: `docs/Especificacion_Requerimientos_0717.xlsx`.

- **Texto de consentimiento informado: VERBATIM.** No parafrasear jamás. Ya
  vive en `features/users/components/ConsentDocument`.
- Consentimiento = **dos checkboxes independientes** (tratamiento de datos +
  registro de consumo). El botón continúa deshabilitado hasta marcar ambos (RF-05).
- Política de contraseña (RF-01): mínimo 8 caracteres, 1 mayúscula, 1 número,
  1 carácter especial. Reusar `PasswordStrength` y las validaciones existentes.
- `estado_registro` ∈ `PENDIENTE_CONSENTIMIENTO | PENDIENTE_REVISION | REGISTRO_COMPLETO`
  (constantes en `features/users/types/registrationStatus.js`).
- Autenticación (RF-02) solo por correo + contraseña.
- **Nunca** loguear (`console.log`) credenciales ni datos de consumo.
- La sesión se cierra por inactividad (comportamiento del prototipo; parametrizar
  los tiempos, no hardcodear en varios sitios).

---

## Referencias dentro del repo

- Prototipo navegable M01: `docs/M01_prototipo_v1.2.1.html` (lógica ya escrita:
  `isValidEmail`, `pwStrength`, `doLogin`, `doRecover`, timeout de inactividad).
- Design system: `docs/Design_System_prototipo_v1.2.html`.
- Requerimientos: `docs/Especificacion_Requerimientos_0717.xlsx`.

Al portar una pantalla del prototipo, tomar la LÓGICA de validación tal cual y
traducirla a la arquitectura del repo (page delgada + hook + services + utils).
NO copiar el CSS inline del prototipo: usar CSS Modules + tokens.

---

## Comandos

```
npm run dev      # desarrollo
npm run build    # producción
npm run lint     # eslint (debe pasar antes de cada PR)
npm run preview  # previsualizar build
```

## Git

- Ramas cortas desde `master`: `feat/145-splash-login`, `feat/147-interfaz-interna`.
- Conventional Commits, referenciando la tarea: `feat(auth): agregar pantalla de login (#145)`.
- PRs pequeños (< ~300 líneas). `git pull --rebase origin master` a diario.
- No tocar `shared/` dentro de una rama de feature sin un PR aparte y pequeño.
