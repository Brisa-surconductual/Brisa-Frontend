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
| Tailwind CSS | Versión instalada en `package.json` |
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

El proyecto utiliza Tailwind CSS integrado mediante el plugin oficial de Vite. No se requiere ejecutar ningún comando adicional para compilar los estilos; Vite procesa Tailwind automáticamente durante `npm run dev` y `npm run build`.

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

La aplicación puede requerir comunicación con servicios del backend según el flujo utilizado. Las URLs y configuraciones necesarias deben definirse mediante variables de entorno documentadas por el equipo.

Las variables utilizadas por Vite deben comenzar con `VITE_`. No se deben exponer secretos, contraseñas ni credenciales sensibles en el frontend.

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
# Conexión Back-Front

Esta sección explica cómo el frontend se comunica con el backend de Brisa, y sirve como guía general para implementar la conexión de **cualquier módulo o historia de usuario**, no solo de una funcionalidad específica.

## Idea general

Toda comunicación con el backend pasa por tres capas fijas, en este orden:

```text
constans.jsx  →  apiClient.jsx  →  api/<archivo-especifico>.jsx
```

1. **`constans.jsx`** define las URLs base.
2. **`apiClient.jsx`** centraliza la configuración de axios (una sola vez, de forma global).
3. **Cada archivo dentro de `api/`** usa esa instancia ya configurada para hacer una llamada concreta.

Un nuevo desarrollador nunca debería configurar axios manualmente dentro de una página o un hook. Siempre se reutiliza `apiClient`.

---

## 1. `shared/utils/constans.jsx`

Aquí vive la URL base del backend y las URLs de cada recurso:

```javascript
export const BASE_URL = 'http://localhost:3000';

export const USUARIOS = `${BASE_URL}/usuarios`;
// A medida que se agreguen módulos nuevos, se suman aquí:
// export const CRONOGRAMA = `${BASE_URL}/cronograma`;
```

**Regla:** la ruta debe coincidir exactamente (mayúsculas/minúsculas incluidas) con la ruta real del backend. Verifícala en Postman o en el log de arranque de Nest (`[RouterExplorer] Mapped {...}`) antes de darla por buena — un desface de casing entre frontend y backend produce errores silenciosos difíciles de rastrear.

---

## 2. `shared/utils/apiClient.jsx`

Instancia única de axios, configurada una sola vez para todo el proyecto:

```javascript
import axios from 'axios';
import { BASE_URL } from './constans.jsx';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
```

- `withCredentials: true` es obligatorio: sin esto, el navegador no envía ni recibe la cookie de sesión (`brisa_session`), y cualquier ruta protegida del backend responderá como si no hubiera sesión, aunque el login haya sido exitoso.
- Este archivo **no se toca** para agregar nuevos módulos. Su única responsabilidad es la configuración compartida de axios.

---

## 3. Carpeta `api/` de cada feature (módulo)

Cada módulo (`features/users`, y los que se agreguen a futuro) tiene su propia carpeta `api/`. Dentro, se crea **un archivo por cada llamada al backend o por cada historia de usuario relacionada** — no un archivo gigante con todas las funciones del módulo.

```text
features/users/api/
├── registration/
│   ├── registrationApi.js   ← crear estudiante
│   └── sesion.jsx           ← consultar sesión actual
└── ...
```

Patrón de un archivo de API típico:

```javascript
import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';

export const registroUsuario = async (usuario) => {
  const { data } = await apiClient.post(`${USUARIOS}/crear/estudiante`, usuario);
  return data;
};
```

Y para peticiones sin body (GET):

```javascript
import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';

export const sesionActual = async () => {
  const { data } = await apiClient.get(`${USUARIOS}/sesion/actual`);
  return data;
};
```

**Reglas para estos archivos:**
- No necesitan importar ni configurar axios directamente — siempre usan `apiClient` ya armado.
- No manejan `try/catch` a menos que necesiten transformar el error; si el error se relanza tal cual, es más simple dejar que el `async/await` lo propague solo.
- El nombre del archivo y de la función debe reflejar la acción de negocio (`registroUsuario`, `sesionActual`), no el verbo HTTP (`postUsuario`, `getSesion`).

---

## 4. De dónde salen los nombres de los campos del payload

Este es el punto donde más errores ocurren al conectar un módulo nuevo, así que se documenta explícitamente:

- **El nombre de cada campo del JSON que se envía debe coincidir exactamente** con lo que el DTO del backend espera — no con el nombre que usa el formulario en React internamente. Es normal que el formulario use nombres en inglés o distintos (`age`, `city`) y el backend use otros (`fechaNacimiento`, `ciudad`). Cuando esto pase, se necesita una función de normalización que traduzca de un vocabulario al otro antes de enviar (ver ejemplo en `BaselinePage/utils/baselineForm.js` → `normalizeBaselineForm`).
- **Las fechas** que vienen de un `<input type="date">` llegan como `"YYYY-MM-DD"`, sin hora. Si el backend usa un campo `DateTime` (Prisma/Postgres), esto falla con `premature end of input`. Hay que completar la hora antes de enviar:
  ```javascript
  function toIsoMidnight(dateOnlyString) {
    return `${dateOnlyString}T00:00:00.000Z`;
  }
  ```
- **Antes de dar por buena la forma del payload**, pruébalo primero en Postman contra el endpoint real. Ese payload que Postman aceptó es la fuente de verdad — el frontend debe replicarlo exactamente, campo por campo, no asumirlo.
- Cuando el backend responde con datos (por ejemplo, el usuario creado), sus claves tampoco tienen por qué coincidir con lo que mandaste — revisa la respuesta real antes de leer sus campos.

---

## 5. Sesión y cookies

La sesión de Brisa se maneja completamente por **cookie `HttpOnly`** — el frontend nunca lee, guarda ni manipula el token manualmente. Esto tiene dos implicaciones prácticas:

1. **Cualquier petición a una ruta protegida** solo necesita `withCredentials: true` (ya está en `apiClient`, así que no hay que hacer nada extra por módulo).
2. **El estado de sesión en React (`isAuthenticated`, `role`, etc.) vive en memoria** y se pierde al recargar la página, aunque la cookie del navegador siga siendo válida. Por eso `AuthProvider.jsx` (en `app/providers/`) rehidrata la sesión al montar la aplicación:
   - Llama a un endpoint de "sesión actual" (`GET /usuarios/sesion/actual`) apenas se carga la app.
   - Si responde con éxito, reconstruye el estado de `isAuthenticated`/`role`/`user` a partir de esa respuesta.
   - Si responde `401` (no hay cookie válida), la app simplemente se queda deslogueada — no es un error a mostrar.
   - Mientras esa verificación está en curso, existe un estado `isLoading` que las rutas protegidas (`RequireAuth`) deben esperar antes de decidir si redirigen al login, para evitar que un usuario con sesión válida sea expulsado por error durante ese instante de carga.

**Para verificar manualmente que la cookie funciona de verdad** (útil al depurar cualquier módulo nuevo):
1. DevTools → **Application** → **Cookies** → confirma que la cookie de sesión existe bajo el dominio del backend.
2. DevTools → **Network** → en la petición de login/registro, revisa que la respuesta trae el header `set-cookie`.
3. Ejecuta en consola `fetch('<url-protegida>', { credentials: 'include' })` y confirma que responde sin necesidad de mandar el token manualmente.
4. Recarga la página (F5) y confirma que la sesión sigue activa gracias a la rehidratación de `AuthProvider`.

---

## Checklist para conectar un módulo/historia de usuario nuevo

1. Confirmar en Postman el endpoint real: método, ruta exacta (case-sensitive), body de ejemplo que el backend acepta, y forma de la respuesta.
2. Si la URL base del módulo no existe todavía, agregarla en `constans.jsx`.
3. Crear el archivo de API correspondiente dentro de `features/<modulo>/api/`, usando `apiClient` — nunca axios directo.
4. Si hay formulario involucrado, revisar que los nombres de campos y el formato de fechas coincidan exactamente con lo validado en Postman; agregar una función de normalización si los vocabularios difieren.
5. Probar la llamada real desde el navegador (Network tab) y comparar el payload contra el de Postman antes de dar el flujo por terminado.
6. Si la ruta requiere sesión, no se necesita configuración adicional — `withCredentials` ya está cubierto por `apiClient` — pero sí verificar que el usuario de prueba tenga una sesión activa antes de probar.
---



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

El proyecto utiliza **Tailwind CSS** para los estilos de componentes y vistas.

La carpeta:

```text
src/styles/
---

styles/
├── tokens.css
└── globals.css

tokens.css

Contiene las variables CSS que definen el sistema visual de Brisa:

Colores de marca.
Colores semánticos.
Superficies.
Colores de texto.
Tipografías.
Espaciados.
Radios.
Sombras.
Variables para modo oscuro.

globals.css

Contiene:

La importación global de Tailwind CSS.
Normalización visual.
Reglas base.
Estilos globales de html, body y #root.
Reglas globales de accesibilidad.
Comportamientos compartidos que no pertenecen a un componente específico.

# Progressive Web App

El proyecto está preparado para evolucionar hacia una PWA con:

- Instalación desde el navegador
- Funcionamiento sin conexión
- Caché de recursos
- Sincronización al recuperar conexión
- Experiencia adaptable a dispositivos móviles

Estas capacidades deben considerarse como evolución de la arquitectura y no asumirse como completamente implementadas mientras no exista configuración específica de service worker y manifiesto.

---

--

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
