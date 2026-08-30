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
/app/administrativo/cronograma
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
└── /app/administrativo
    └── /app/administrativo/cronograma
        ├── /app/administrativo/cronograma/nueva
        ├── /app/administrativo/cronograma/pausas
        │   └── /app/administrativo/cronograma/pausas/nueva
        ├── /app/administrativo/cronograma/progreso
        └── /app/administrativo/cronograma/:unitId
```

Las rutas bajo `/app` requieren una sesión válida y aplican control de acceso por rol.

Las rutas de administración del cronograma pertenecen al rol administrativo y se mantienen dentro de la sección global **Cronograma**. Las vistas internas como pausas, progreso o detalle de una unidad temporal no crean nuevas pestañas administrativas globales.

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

El objetivo del repositorio es que ambos comandos finalicen sin errores.

### Estado conocido al cierre de FE-M04-08

La compilación de producción del frontend finaliza correctamente.

Actualmente el lint global continúa reportando **6 errores preexistentes del Módulo 1 (`users`)**. Estos errores no fueron introducidos por el trabajo del Módulo 4. Mientras se corrige esa deuda técnica, cualquier cambio nuevo debe cumplir dos condiciones:

1. No agregar errores adicionales al lint global.
2. Pasar el lint específico de los archivos o feature modificados.

Para validar el Módulo 4 se puede ejecutar:

```bash
npx eslint \
  src/features/cronograma \
  src/app/router/AppRouter.jsx
```

Antes de confirmar cambios también se recomienda:

```bash
git diff --check
```

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

Algunos flujos existentes del Módulo 1 todavía utilizan estructuras simuladas o estado en memoria mientras se completa su integración con backend. Dichos datos pueden perderse al:

- Recargar completamente la página.
- Reiniciar el servidor de Vite.
- Recargar módulos durante ciertos cambios.
- Cerrar y volver a abrir la aplicación.

Este comportamiento es temporal y debe ser reemplazado por persistencia real en backend.

### Regla aplicada en el Módulo 4

El Módulo 4 (`cronograma`) **no utiliza mocks como fuente de verdad final**.

Cuando todavía no existe una fuente real de backend:

- Las vistas reciben los datos mediante props o variables preparadas para integración.
- Se utilizan estados vacíos como `[]` o `null` para representar información aún no disponible.
- Los fixtures temporales solo pueden usarse para comprobar visualmente una interfaz durante desarrollo y deben eliminarse antes del commit.
- No se usa `localStorage` como sustituto del backend.
- No se implementa CRUD ficticio en React.
- No se duplican en frontend reglas de negocio que deben resolver backend u otras capas.

Ejemplos de información que el frontend debe recibir ya resuelta cuando exista la integración:

```text
canAnnul
currentWeek
currentDay
status
progressSummary
completedParticipant
validations
```

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
│   ├── users/
│   └── cronograma/
├── shared/
├── assets/
├── styles/
├── App.jsx
└── main.jsx
```

## Regla de organización por módulos

Cada carpeta ubicada directamente dentro de `src/features` representa un **módulo funcional del proyecto**.

Actualmente el frontend contiene, entre otras responsabilidades, las features principales:

```text
features/
├── users/       # Módulo 1
└── cronograma/  # Módulo 4
```

La autenticación, el registro, las vistas del estudiante y las vistas administrativas asociadas al Módulo 1 permanecen en `features/users`.

La gestión del cronograma, sus unidades temporales, pausas administrativas y progreso temporal de participantes pertenece a `features/cronograma`.

Por esta razón no deben crearse features independientes únicamente por rol, página o subproceso, por ejemplo:

```text
features/auth/
features/student/
features/psychology/
features/pauses/
features/progress/
```

Las responsabilidades internas deben permanecer dentro del módulo al que pertenecen.

Cuando se implemente un módulo nuevo, podrá agregarse otra carpeta al mismo nivel siempre que represente realmente un dominio funcional del proyecto y no una pantalla aislada.

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
# Feature `cronograma` — Módulo 4

La feature `cronograma` concentra la interfaz administrativa construida para el Módulo 4.

El trabajo realizado cubre FE-M04-01 a FE-M04-08 y deja preparada la estructura para integrar posteriormente los datos reales del backend sin convertir el frontend en una fuente de reglas de negocio o persistencia.

## Alcance implementado

| Tarea | Funcionalidad |
|---|---|
| FE-M04-01 | Estructura inicial de la feature `cronograma` y rutas protegidas |
| FE-M04-02 | Vista administrativa del cronograma, filtros, listado, estados y detalle |
| FE-M04-03 | Creación de unidades temporales |
| FE-M04-04 | Modificación y eliminación visual de unidades temporales |
| FE-M04-05 | Flujo visual de activación y validaciones del cronograma |
| FE-M04-06 | Registro de pausas administrativas |
| FE-M04-07 | Historial y anulación visual de pausas administrativas |
| FE-M04-08 | Progreso y ubicación temporal de participantes |

## Responsabilidades actuales

La feature permite representar:

- Consulta administrativa del cronograma.
- Filtrado visual de unidades temporales.
- Creación de unidades temporales.
- Consulta de detalle de una unidad temporal.
- Edición y eliminación según capacidades recibidas por la UI.
- Estado de activación del cronograma.
- Validaciones previas a la activación.
- Registro de pausas administrativas.
- Historial de pausas.
- Estados `ACTIVA`, `FINALIZADA` y `ANULADA` para pausas.
- Confirmación visual antes de anular una pausa.
- Resumen de progreso de participantes.
- Ubicación temporal individual.
- Semana actual y día actual recibidos desde la fuente correspondiente.
- Estados `ACTIVO`, `EN_PAUSA` y `COMPLETADO`.
- Representación separada del participante que completó el cronograma.

## Organización general de `cronograma`

```text
cronograma/
├── components/
│   ├── AdministrativePauseCard/
│   ├── AdministrativePauseForm/
│   ├── AdministrativePauseList/
│   ├── CompletedParticipantProgress/
│   ├── EmptyScheduleState/
│   ├── ParticipantProgressCard/
│   ├── ParticipantProgressList/
│   ├── ParticipantProgressSummary/
│   ├── ScheduleActivationDialog/
│   ├── ScheduleActivationStatus/
│   ├── ScheduleFilters/
│   ├── TemporalUnitActions/
│   ├── TemporalUnitCard/
│   ├── TemporalUnitForm/
│   └── TemporalUnitList/
├── pages/
│   ├── AdministrativePauseHistoryPage/
│   ├── CreateAdministrativePausePage/
│   ├── CreateTemporalUnitPage/
│   ├── ParticipantProgressPage/
│   ├── ScheduleManagementPage/
│   └── TemporalUnitDetailPage/
├── types/
│   ├── administrativePauseTypes.js
│   ├── participantProgressTypes.js
│   └── scheduleTypes.js
├── utils/
└── index.js
```

La estructura puede seguir creciendo únicamente cuando aparezcan responsabilidades reales que lo justifiquen.

## Rutas del Módulo 4

```text
/app/administrativo/cronograma
/app/administrativo/cronograma/nueva
/app/administrativo/cronograma/pausas
/app/administrativo/cronograma/pausas/nueva
/app/administrativo/cronograma/progreso
/app/administrativo/cronograma/:unitId
```

Todas estas rutas se encuentran bajo el área protegida de la aplicación y requieren el rol administrativo correspondiente.

### `/app/administrativo/cronograma`

Vista principal de gestión del cronograma.

Desde allí se puede acceder a:

```text
Progreso por usuario
Pausas administrativas
Crear unidad temporal
```

También representa el estado de activación, filtros y listado de unidades temporales.

### `/app/administrativo/cronograma/nueva`

Formulario de creación de unidad temporal.

La validación local cubre únicamente reglas propias del formulario. Las reglas de negocio que dependan de información global o persistida deben resolverse mediante backend.

### `/app/administrativo/cronograma/:unitId`

Vista de detalle de una unidad temporal.

Permite representar las acciones de edición y eliminación según el estado y las capacidades que reciba la interfaz.

### `/app/administrativo/cronograma/pausas`

Historial de pausas administrativas.

Cada pausa puede representar:

```text
Participante
Periodo
Motivo
Estado
Acción Anular
```

La posibilidad de anulación se recibe mediante `canAnnul`. El frontend no deduce automáticamente que una pausa puede anularse solo por encontrarse en estado `ACTIVA`.

### `/app/administrativo/cronograma/pausas/nueva`

Formulario para registrar una pausa administrativa.

Incluye:

- Participante.
- Fecha inicial.
- Fecha final.
- Motivo.
- Validaciones locales de campos obligatorios y rango de fechas.

Las validaciones de solapamiento u otras reglas que dependan de información persistida corresponden al backend.

### `/app/administrativo/cronograma/progreso`

Vista de **Progreso por usuario**.

Incluye:

```text
Resumen del progreso
├── Participantes
├── Activos
└── En pausa

Ubicación temporal
├── Participante
├── Unidad temporal
├── Semana actual
├── Día actual
└── Estado

Programa completado
├── Participante
├── Correo
├── Progreso final
└── Estado COMPLETADO
```

Los conteos y la ubicación temporal no se calculan mediante `filter`, `reduce`, fechas locales o lógica duplicada en React. La vista está preparada para recibir esos valores ya resueltos.

## Estados técnicos centralizados

Los códigos técnicos del Módulo 4 se mantienen en `types`.

Ejemplos:

```text
scheduleTypes.js
administrativePauseTypes.js
participantProgressTypes.js
```

Esto evita dispersar cadenas técnicas dentro de componentes.

### Pausas administrativas

```text
ACTIVA
FINALIZADA
ANULADA
```

### Progreso de participantes

```text
ACTIVO
EN_PAUSA
COMPLETADO
```

Los estados de pausas, participantes y unidades temporales son conceptos diferentes y no deben reutilizarse como si fueran equivalentes.

## Componentes compartidos reutilizados

El Módulo 4 reutiliza componentes existentes de `shared` cuando la responsabilidad es transversal.

Entre ellos:

```text
AdministrativeHeader
AdministrativeTabBar
Button
TextField
SelectField
ConfirmationDialog
```

No se deben crear copias locales de estos componentes dentro de `cronograma` si la responsabilidad ya está resuelta en `shared`.

## Separación frontend / backend en M04

La interfaz del cronograma sigue esta regla:

```text
Backend / capa de integración
            ↓
      datos resueltos
            ↓
       componentes UI
```

No se debe reemplazar temporalmente esa arquitectura por:

```text
React
 ↓
mini backend local
 ↓
reglas de negocio ficticias
 ↓
persistencia simulada
```

Por ejemplo, el frontend no debe decidir por su cuenta:

- Si existe solapamiento entre pausas registradas.
- Si un cronograma cumple todas las condiciones para activarse.
- Si una pausa puede anularse basándose solamente en su estado.
- En qué semana o día debe estar un participante.
- Cuántos participantes están activos o en pausa.
- Qué participante completó el cronograma.

La UI sí puede realizar validaciones locales propias de formularios, como:

- Campos requeridos.
- Formato esperado.
- Comparación básica entre fecha inicial y fecha final.

## Datos temporales para pruebas visuales

Los fixtures pueden utilizarse durante desarrollo únicamente para comprobar estados de interfaz.

Antes del commit deben retirarse.

El código final de M04 utiliza estados vacíos o valores nulos cuando todavía no existe una fuente real, por ejemplo:

```text
[]
null
—
```

Un valor desconocido no debe presentarse como `0`, `ACTIVO`, `ANULADA` o cualquier otro resultado que implique una respuesta de negocio inexistente.

## API pública de `cronograma`

El archivo:

```text
src/features/cronograma/index.js
```

expone principalmente las páginas utilizadas por el router.

Los componentes, tipos y utilidades internos deben importarse desde su archivo responsable cuando se utilizan dentro de la propia feature.

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

## Estado de integración del Módulo 4

Las vistas de `cronograma` se encuentran estructuradas para conectar posteriormente los endpoints reales del backend.

Mientras esos endpoints no estén confirmados:

- No se deben inventar rutas REST.
- No se debe agregar una constante `CRONOGRAMA` con una URL asumida.
- No se deben crear respuestas mock como fuente definitiva.
- No se debe implementar persistencia local para reemplazar al backend.
- Los nombres de payloads y respuestas deben definirse a partir del DTO y respuesta real del backend.

Cuando la integración esté disponible, debe mantenerse el patrón general:

```text
constans.jsx
      ↓
apiClient.jsx
      ↓
features/cronograma/api/
      ↓
hooks o páginas
      ↓
componentes de presentación
```

La incorporación de `features/cronograma/api/` debe hacerse cuando existan endpoints reales que justifiquen esos archivos, no antes.

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

La carpeta de estilos globales es:

```text
src/styles/
├── tokens.css
└── globals.css
```

## `tokens.css`

Contiene las variables CSS que definen el sistema visual de Brisa:

- Colores de marca.
- Colores semánticos.
- Superficies.
- Colores de texto.
- Tipografías.
- Espaciados.
- Radios.
- Sombras.
- Variables para modo oscuro.

## `globals.css`

Contiene:

- La importación global de Tailwind CSS.
- Normalización visual.
- Reglas base.
- Estilos globales de `html`, `body` y `#root`.
- Reglas globales de accesibilidad.
- Comportamientos compartidos que no pertenecen a un componente específico.

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

- Cada carpeta ubicada directamente en `features` representa un módulo funcional del proyecto.
- Los roles, páginas o partes internas de un módulo no deben convertirse en features separadas.
- Las responsabilidades de autenticación, registro, estudiante y vistas administrativas del Módulo 1 pertenecen a `features/users`.
- Las responsabilidades de cronograma, unidades temporales, pausas y progreso temporal del Módulo 4 pertenecen a `features/cronograma`.
- Los componentes compartidos por varias features se ubican en `shared`.
- Los componentes utilizados únicamente por una feature permanecen dentro de esa feature.
- Los componentes exclusivos de una página permanecen dentro de `pages/<NombrePage>/components` cuando su reutilización no justifica subirlos de nivel.
- La comunicación con el backend se implementa en `api` cuando existe una integración real o contrato confirmado.
- Los mocks pueden utilizarse únicamente como apoyo temporal de desarrollo y no deben convertirse en fuente de verdad definitiva.
- No se debe utilizar `localStorage` o estado React como sustituto permanente de persistencia de backend.
- Las páginas pueden contener subcarpetas locales de `components`, `hooks`, `data` y `utils`.
- No todas las páginas están obligadas a tener las mismas subcarpetas.
- La estructura debe responder a responsabilidades reales y no crear archivos innecesarios.
- Los códigos técnicos y roles se centralizan en archivos de `types`.
- No se deben duplicar constantes equivalentes entre vistas o módulos.
- Las exportaciones públicas de cada módulo se consolidan en `features/<modulo>/index.js`.
- Los imports internos de una feature deben apuntar directamente al archivo responsable cuando esto ayuda a evitar dependencias circulares.
- Las reglas de negocio que dependen de información persistida deben resolverse en backend o en la capa correspondiente; React debe representar los resultados recibidos.
- Las vistas internas de Cronograma permanecen bajo la pestaña administrativa `Cronograma`; no se crea una pestaña global por cada subfuncionalidad.
- Antes de subir cambios se deben ejecutar `npm run lint`, `npm run build` y `git diff --check`.

---

# Scripts disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run build` | Genera la compilación de producción |
| `npm run preview` | Sirve localmente la compilación generada |
