# Brisa Frontend

Frontend desarrollado con **React** y **Vite**, siguiendo una arquitectura **SPA (Single Page Application)** organizada mediante **Feature-Based Architecture**, **Screaming Architecture** y **Component-Based Architecture**. El proyecto está preparado para evolucionar hacia una **Progressive Web App (PWA)** bajo un enfoque **Offline-First**.

---

## Tecnologías

| Tecnología | Versión o requisito |
|---|---|
| Node.js | 22 LTS o superior |
| npm | 10 o superior |
| React | 19.2.7 |
| Vite | 8.1.4 |
| JavaScript | ES2024 |
| React Router | Versión instalada en `package.json` |

> Las versiones instaladas realmente en el proyecto se encuentran en `package.json` y `package-lock.json`. No deben modificarse manualmente sin coordinación con el equipo.

---

## Requisitos previos

Antes de iniciar el entorno de desarrollo se debe tener instalado:

1. **Git**
2. **Node.js 22 LTS o superior**
3. **npm 10 o superior**
4. Un editor de código, preferiblemente **Visual Studio Code**
5. Acceso al repositorio de GitHub

Verificar las instalaciones:

```bash
git --version
node --version
npm --version
```

Resultados mínimos esperados:

```text
Node.js: v22.x.x o superior
npm: 10.x.x o superior
```

Si `node` o `npm` no son reconocidos, se debe instalar o actualizar Node.js y reiniciar la terminal.

---

# Puesta en marcha del entorno de desarrollo

## 1. Clonar el repositorio

Ubicarse en la carpeta donde se desea guardar el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entrar a la carpeta:

```bash
cd Brisa-Frontend
```

Comprobar que se está en la raíz correcta:

```bash
git status
```

En esta carpeta deben existir, entre otros, los siguientes archivos:

```text
package.json
package-lock.json
vite.config.js
src/
```

> Todos los comandos de npm deben ejecutarse desde la carpeta que contiene `package.json`.

---

## 2. Cambiar a la rama de trabajo

Consultar las ramas disponibles:

```bash
git branch
```

Cambiar a la rama asignada:

```bash
git switch <nombre-de-la-rama>
```

Si la rama existe solamente en GitHub:

```bash
git fetch origin
git switch --track origin/<nombre-de-la-rama>
```

Confirmar la rama actual:

```bash
git branch --show-current
```

No se recomienda desarrollar directamente sobre `master`, salvo autorización expresa del líder del proyecto.

---

## 3. Descargar los cambios más recientes

Antes de instalar dependencias o empezar a programar:

```bash
git pull --rebase
```

Si la rama todavía no tiene seguimiento remoto:

```bash
git pull --rebase origin <nombre-de-la-rama>
```

Antes del `pull`, el árbol de trabajo debería estar limpio. Verificarlo con:

```bash
git status
```

---

## 4. Instalar las dependencias

Como el repositorio contiene `package-lock.json`, para una instalación limpia y reproducible se recomienda:

```bash
npm ci
```

Este comando instala exactamente las versiones registradas en el archivo de bloqueo.

Usar:

```bash
npm install
```

solamente cuando:

- No existe `package-lock.json`.
- Se agregó, eliminó o actualizó una dependencia.
- El equipo necesita regenerar el archivo de bloqueo.

No se deben editar manualmente:

```text
node_modules/
package-lock.json
```

Tampoco se debe subir la carpeta `node_modules` a GitHub.

---

## 5. Configurar variables de entorno

Revisar si el repositorio contiene un archivo:

```text
.env.example
```

Si existe, crear una copia local.

En PowerShell:

```powershell
Copy-Item .env.example .env
```

En Bash:

```bash
cp .env.example .env
```

Completar únicamente los valores indicados por el equipo.

Consideraciones:

- Las variables que necesita Vite deben comenzar con `VITE_`.
- No se deben guardar contraseñas, tokens reales ni secretos en variables expuestas al frontend.
- El archivo `.env` no debe subirse al repositorio.
- Cuando se modifique `.env`, se debe reiniciar `npm run dev`.

En el estado actual, los flujos de autenticación y registro utilizan APIs simuladas y almacenes en memoria, por lo que pueden probarse sin ejecutar un backend. Cuando se conecte el backend, el equipo deberá documentar aquí la URL y las variables necesarias.

---

## 6. Iniciar el servidor de desarrollo

Ejecutar:

```bash
npm run dev
```

Vite mostrará una salida similar a:

```text
Local: http://localhost:5173/
```

Abrir en el navegador la dirección exacta indicada por la terminal.

La ruta inicial de la aplicación es:

```text
http://localhost:5173/
```

Esta ruta carga `SplashPage`.

Rutas útiles durante el desarrollo:

```text
/login
/registro/cuenta
/app
```

> `npm run dev` no selecciona una página concreta. React Router muestra la vista correspondiente a la URL abierta en el navegador. Si la pestaña conserva una ruta anterior, escribir manualmente `/` para regresar a la pantalla inicial.

### Flujo principal de rutas

```text
/
└── SplashPage
    ├── /login
    └── /registro/cuenta

/registro
├── /registro/cuenta
├── /registro/consentimiento
├── /registro/linea-base
├── /registro/revision
├── /registro/reconsentimiento
└── /registro/completado

/app
├── /app/estudiante
└── /app/psicologia
```

Las rutas bajo `/app` requieren una sesión válida y aplican control de acceso por rol.

Para detener el servidor:

```text
Ctrl + C
```

---

## 7. Validar el proyecto antes de trabajar o subir cambios

Ejecutar el análisis estático:

```bash
npm run lint
```

Compilar el proyecto:

```bash
npm run build
```

Ambos comandos deben finalizar sin errores.

La compilación genera:

```text
dist/
```

Esta carpeta es un resultado automático y no debe editarse manualmente.

---

## 8. Probar la compilación de producción

Después de ejecutar `npm run build`:

```bash
npm run preview
```

Vite mostrará una URL local para probar la versión compilada.

> El comando correcto es `npm run preview`, no `npm preview`.

---

# Flujo recomendado para cada jornada de trabajo

```bash
git status
git branch --show-current
git pull --rebase
npm ci
npm run dev
```

No es obligatorio ejecutar `npm ci` todos los días. Se recomienda hacerlo cuando:

- Se acaba de clonar el repositorio.
- Cambió `package-lock.json`.
- Otro integrante agregó o actualizó dependencias.
- Aparecen errores relacionados con paquetes faltantes.

Antes de crear un commit:

```bash
npm run lint
npm run build
git status
git diff
```

---

# Consideraciones importantes

## Ejecutar los comandos desde la raíz

Los comandos deben ejecutarse donde se encuentra `package.json`.

Ejemplo correcto:

```text
Brisa-Frontend/
├── package.json
├── src/
└── vite.config.js
```

## No modificar archivos generados

No editar ni subir manualmente:

```text
node_modules/
dist/
.env
```

## Importaciones con alias

El proyecto utiliza importaciones con el alias:

```javascript
import { useAuth } from '@/app/providers/index.js';
```

El alias `@` representa la carpeta `src`. Su configuración debe mantenerse sincronizada con Vite y las herramientas del proyecto.

## Sensibilidad a mayúsculas y minúsculas

Aunque Windows suele aceptar diferencias de mayúsculas, los entornos Linux sí las distinguen.

Evitar diferencias como:

```text
LoginPage.jsx
loginPage.jsx
```

Los nombres de carpetas, archivos e imports deben coincidir exactamente.

## Estado simulado en memoria

Los mocks actuales utilizan estructuras en memoria. Las cuentas o estados creados durante una prueba pueden perderse al:

- Recargar completamente la página.
- Reiniciar el servidor de Vite.
- Recargar módulos durante ciertos cambios.
- Cerrar y volver a abrir la aplicación.

Este comportamiento es temporal y será reemplazado por persistencia en el backend.

## Trabajo dentro de OneDrive

En Windows, OneDrive puede bloquear archivos, retrasar actualizaciones o interferir con `node_modules` y el Hot Module Replacement de Vite.

Si aparecen errores frecuentes de permisos, archivos bloqueados o recargas inconsistentes, se recomienda clonar el repositorio en una ruta local no sincronizada, por ejemplo:

```text
C:\Proyectos\Brisa-Frontend
```

---

# Solución de problemas comunes

## `npm` o `node` no se reconoce

Cerrar y abrir la terminal después de instalar Node.js.

Verificar:

```bash
node --version
npm --version
```

## Error de dependencias o módulos faltantes

Primero intentar:

```bash
npm ci
```

Si el problema continúa y el equipo confirma que `package-lock.json` está actualizado:

En PowerShell:

```powershell
Remove-Item node_modules -Recurse -Force
npm ci
```

No eliminar `package-lock.json` sin autorización del equipo.

## El puerto 5173 está ocupado

Vite puede seleccionar otro puerto automáticamente. Usar la URL que muestre la terminal.

También se puede ejecutar:

```bash
npm run dev -- --port 5174
```

## La aplicación abre una ruta distinta a la esperada

Escribir manualmente:

```text
http://localhost:5173/
```

También se puede abrir una ventana privada para descartar una ruta o sesión conservada por el navegador.

## La aplicación muestra una pantalla en blanco

Revisar:

1. La consola del navegador.
2. La terminal donde se ejecuta Vite.
3. Errores de importación.
4. Diferencias de mayúsculas en nombres de archivos.
5. Que las dependencias estén instaladas.
6. Que se haya abierto la URL indicada por Vite.

## PowerShell impide ejecutar npm

Si aparece un error relacionado con `npm.ps1` y la política de ejecución, abrir PowerShell como usuario normal y ejecutar:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Confirmar el cambio y abrir una terminal nueva.

## Los cambios de otra persona no aparecen

Comprobar la rama:

```bash
git branch --show-current
```

Actualizar referencias y descargar cambios:

```bash
git fetch origin
git pull --rebase
```

Si cambió `package-lock.json`, ejecutar:

```bash
npm ci
```

---

# Arquitectura

El proyecto implementa:

- SPA (Single Page Application)
- Feature-Based Architecture
- Screaming Architecture
- Component-Based Architecture
- Offline-First como evolución hacia PWA
- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión

El objetivo es mantener una aplicación modular, reutilizable y escalable, donde la estructura refleje el dominio del negocio.

---

# Organización general

```text
src/
├── app/
│   ├── config/
│   ├── layouts/
│   ├── providers/
│   └── router/
├── features/
│   └── users/
├── shared/
├── assets/
├── styles/
├── App.jsx
└── main.jsx
```

## Regla de organización por módulos

Cada carpeta ubicada directamente dentro de `src/features` representa un **módulo funcional del proyecto**.

Actualmente se está desarrollando el **Módulo 1**, por lo que existe una sola feature principal:

```text
features/
└── users/
```

La autenticación, el registro, las vistas del estudiante y las vistas de psicología forman parte del mismo módulo. Por esta razón no deben existir como features independientes:

```text
features/auth/
features/student/
features/psychology/
```

Esas responsabilidades se organizan internamente dentro de `features/users`.

Cuando se implemente otro módulo del proyecto, podrá agregarse una nueva carpeta al mismo nivel, siempre que represente realmente un módulo y no un rol, una página o una parte interna de otro módulo.

---

# App

Contiene la configuración global:

- Router
- Providers
- Layouts
- Configuración de sesión
- Estado compartido de aplicación

```text
app/
├── config/
├── layouts/
├── providers/
└── router/
```

---

# Feature `users` — Módulo 1

La feature `users` concentra las responsabilidades del Módulo 1:

- Pantalla inicial.
- Inicio de sesión.
- Recuperación de contraseña.
- Creación de cuenta.
- Consentimiento.
- Línea base.
- Revisión y reconsentimiento.
- Confirmación del registro.
- Gestión de la sesión simulada.
- Inicio del estudiante.
- Inicio del perfil de psicología.
- Control de acceso por roles.

Su organización general es:

```text
users/
├── api/
│   ├── auth/
│   ├── registration/
│   ├── authApi.js
│   └── registrationApi.js
├── components/
├── context/
├── hooks/
├── pages/
│   ├── SplashPage/
│   ├── LoginPage/
│   ├── RecoverRequestPage/
│   ├── RecoverResetPage/
│   ├── CreateAccountPage/
│   ├── ConsentPage/
│   ├── BaselinePage/
│   ├── ReviewPage/
│   ├── ReconsentPage/
│   ├── RegistrationCompletedPage/
│   ├── StudentHomePage/
│   └── PsychologyHomePage/
├── services/
├── types/
├── utils/
└── index.js
```

No todas las páginas deben tener obligatoriamente las mismas subcarpetas. Una página puede incluir `components`, `hooks`, `data` o `utils` únicamente cuando su responsabilidad lo requiera.

Ejemplos:

```text
PsychologyHomePage/
├── components/
├── data/
│   ├── psychologyStats.js
│   └── psychologyTabs.js
├── hooks/
├── utils/
│   └── aggregates.js
├── PsychologyHomePage.jsx
├── PsychologyHomePage.module.css
└── index.js
```

```text
StudentHomePage/
├── components/
├── data/
│   └── studentModules.js
├── hooks/
├── utils/
│   └── studentUser.js
├── StudentHomePage.jsx
├── StudentHomePage.module.css
└── index.js
```

## `api`

Contiene las funciones que simulan o realizan la comunicación con el backend.

La API pública se mantiene en archivos como:

```text
authApi.js
registrationApi.js
```

Los detalles internos se organizan en subcarpetas:

```text
api/
├── auth/
│   ├── authApiUtils.js
│   └── authMockStore.js
└── registration/
    ├── accountApi.js
    ├── baselineApi.js
    ├── confirmationApi.js
    ├── consentApi.js
    ├── registrationApiUtils.js
    └── registrationMockStore.js
```

## `components`

Contiene componentes exclusivos del Módulo 1 que pueden reutilizarse en varias páginas de `users`.

Ejemplos:

```text
ConsentDocument/
PasswordStrength/
RegistrationStepper/
ReviewCard/
StudentHeader/
StudentBottomNav/
PsychologyHeader/
PsychologyTabBar/
```

Los componentes usados únicamente por una página deben permanecer dentro de la carpeta local `components` de esa página.

## `context`

Contiene el estado compartido del proceso de registro.

```text
context/
├── RegistrationProvider.jsx
├── registrationContext.js
├── registrationReducer.js
└── index.js
```

La sesión global de autenticación se administra desde los providers de `app`, mientras que los datos provisionales del registro permanecen dentro del contexto de `users`.

## `hooks`

Contiene hooks reutilizados por diferentes partes del módulo.

Los hooks exclusivos de una página permanecen en:

```text
pages/<NombrePage>/hooks/
```

## `pages`

Contiene las vistas asociadas a las rutas de React Router.

Cada página debe concentrarse en la composición visual y delegar la lógica compleja a hooks, servicios o utilidades cuando sea necesario.

## `services`

Contiene reglas de negocio, validaciones, cálculos y transformaciones del Módulo 1.

Ejemplos:

```text
authValidation.js
baselineValidation.js
registrationReview.js
registrationValidation.js
```

## `types`

Centraliza constantes y códigos técnicos del dominio.

Ejemplos:

```text
authTypes.js
baselineCatalogs.js
registrationFields.js
registrationStatus.js
```

Los roles deben tener una única fuente de verdad. No se deben duplicar archivos separados de roles para estudiante y psicología.

## `utils`

Contiene funciones auxiliares sin dependencias directas de React.

Una utilidad utilizada únicamente por una página debe permanecer dentro de esa página. La carpeta `users/utils` se reserva para utilidades realmente compartidas por diferentes partes del módulo.

## `data`

Se utiliza dentro de páginas concretas para catálogos, configuraciones visuales o datos simulados exclusivos de esa vista.

Ejemplos:

```text
PsychologyHomePage/data/psychologyStats.js
PsychologyHomePage/data/psychologyTabs.js
StudentHomePage/data/studentModules.js
```

## `index.js`

Es la API pública de la feature.

Debe exportar principalmente:

- Páginas consumidas por el router.
- Providers requeridos fuera de la feature.
- Tipos estrictamente necesarios desde otras capas.

No debe exponer automáticamente todas las funciones, datos o utilidades internas.

---

# Lineamientos de páginas y layouts

Las páginas principales posteriores al inicio de sesión deben renderizarse como vistas completas dentro de `ProtectedLayout`.

No deben presentarse como cuadros modales, overlays o marcos de prototipo centrados sobre un fondo. La estructura esperada es:

```text
ProtectedLayout
├── Encabezado o navegación
├── Contenido de la ruta mediante Outlet
└── Navegación complementaria cuando corresponda
```

Los modales se reservan para acciones puntuales que requieran atención temporal, como confirmaciones o formularios breves, y no para representar la página principal del estudiante o de psicología.

---

# Shared

Contiene recursos reutilizables por varias features:

- Componentes de interfaz
- Componentes de marca
- Hooks compartidos
- Utilidades generales
- Tipos globales

Un componente usado solo por una feature debe permanecer dentro de esa feature.

---

# Assets

Contiene recursos estáticos:

- Imágenes
- Iconos
- Logos
- Tipografías

---

# Styles

Contiene estilos globales:

- Variables
- Temas
- Estilos base
- Normalización visual

Los estilos exclusivos de un componente se mantienen en archivos `*.module.css`.

---

# Progressive Web App

El proyecto está preparado para evolucionar hacia una PWA con:

- Instalación desde el navegador
- Funcionamiento sin conexión
- Caché de recursos
- Sincronización al recuperar conexión
- Experiencia adaptable a dispositivos móviles

Estas capacidades deben considerarse como evolución de la arquitectura y no asumirse como completamente implementadas mientras no exista configuración específica de service worker y manifiesto.

---

# Convenciones

- Cada carpeta ubicada directamente en `features` representa un módulo del proyecto.
- Los roles, páginas o partes internas de un módulo no deben convertirse en features separadas.
- Las responsabilidades de autenticación, registro, estudiante y psicología del Módulo 1 pertenecen a `features/users`.
- Los componentes compartidos por varias features se ubican en `shared`.
- Los componentes utilizados únicamente por `users` permanecen dentro de esa feature.
- Los componentes exclusivos de una página permanecen dentro de `pages/<NombrePage>/components`.
- La comunicación con el backend o sus simulaciones se implementa en `api`.
- Las páginas pueden contener subcarpetas locales de `components`, `hooks`, `data` y `utils`.
- No todas las páginas están obligadas a tener las mismas subcarpetas.
- La estructura debe responder a responsabilidades reales y no crear archivos innecesarios.
- Los códigos técnicos y roles se centralizan en archivos de `types`.
- No se deben duplicar constantes de roles entre vistas de estudiante y psicología.
- Las exportaciones públicas del módulo se consolidan en `features/users/index.js`.
- Los imports internos de la feature deben apuntar directamente al archivo responsable para evitar dependencias circulares.
- Antes de subir cambios se deben ejecutar `npm run lint` y `npm run build`.

---

# Scripts disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run build` | Genera la compilación de producción |
| `npm run preview` | Sirve localmente la compilación generada |
