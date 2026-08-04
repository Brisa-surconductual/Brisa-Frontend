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
│   ├── auth/
│   ├── psychology/
│   ├── student/
│   └── users/
├── shared/
├── assets/
├── styles/
├── App.jsx
└── main.jsx
```

La estructura puede crecer con nuevas features a medida que se implementen otros módulos.

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

# Features

Cada carpeta representa una funcionalidad o dominio del negocio.

├── usuarios/
├── cronograma/
├── chat/
├── diario/
├── segumiento/
├── notificacion/
├── gamificacion/
└── administartivo/
```

Cada feature es independiente de las demás.

Esta organización facilita el mantenimiento y permite que el crecimiento del proyecto sea modular.

Ejemplo de una feature:

```text
users/
├── api/
├── components/
├── context/
├── hooks/
├── pages/
├── services/
├── types/
├── utils/
└── index.js
```

## `api`

Funciones que simulan o realizan la comunicación con el backend.

## `components`

Componentes exclusivos de la feature.

## `context`

Estado compartido dentro de la feature cuando sea necesario.

## `hooks`

Hooks personalizados relacionados con la funcionalidad.

## `pages`

Vistas principales asociadas a las rutas.

## `services`

Reglas, validaciones, cálculos y transformaciones de datos.

## `types`

Constantes, enumeraciones y definiciones de dominio.

## `utils`

Funciones auxiliares sin dependencias directas de React.

## `index.js`

Punto de exportación pública de la feature.

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

- Cada feature representa una funcionalidad del negocio.
- Los componentes compartidos se ubican en `shared`.
- Los componentes específicos permanecen dentro de su feature.
- La comunicación con el backend o sus simulaciones se implementa en `api`.
- Las páginas se organizan por ruta y pueden contener subcarpetas locales de `components`, `hooks` y `utils`.
- No todas las páginas están obligadas a tener las mismas subcarpetas.
- La estructura debe responder a responsabilidades reales y no crear archivos innecesarios.
- Los códigos técnicos se centralizan en archivos de `types`.
- Antes de subir cambios se deben ejecutar `npm run lint` y `npm run build`.

---

# Scripts disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run build` | Genera la compilación de producción |
| `npm run preview` | Sirve localmente la compilación generada |
