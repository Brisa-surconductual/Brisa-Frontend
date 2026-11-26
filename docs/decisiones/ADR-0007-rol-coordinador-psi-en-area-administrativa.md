# ADR-0007 — El rol COORDINADOR_PSI entra al área administrativa

**Estado:** Propuesta
**Fecha:** 2026-11-25
**Tarea de origen:** FE-336b · enmienda E1
**Propone:** Sebastián · **Acepta:** Juan Esteban (revisión del PR)
**Afecta a:** `src/features/users/types/authTypes.js`, `src/app/router/roleRoutes.js`,
`src/app/router/AppRouter.jsx`, `AdminLayout`; todo el equipo que agregue rutas o roles;
PR 2 de FE-336

## Contexto

El frontend solo conocía `ESTUDIANTE` y `ADMINISTRATIVO` (`USER_ROLE`). El backend ya devuelve
`rol: 'COORDINADOR_PSI'` en el login y acepta `ADMINISTRATIVO` y `COORDINADOR_PSI` en todas las
rutas `/admin` (también `/chat/admin`, las administrativas de `/cronograma` y de `/usuarios`).
El coordinador es el único rol que concede permisos de acceso individual (RF-04).

Con el código anterior, un coordinador iniciaba sesión, `getHomePathForRole` devolvía `/login` y
el `RequireAuth` del área administrativa solo admitía `ADMINISTRATIVO`. Sin esta decisión nadie
podía usar la pantalla de permisos del PR 2 de FE-336.

Es una decisión transversal: la lista de roles y su ruta de inicio la leen el login,
`RoleHomeRedirect`, `RequireAuth` y `AdminLayout`. Por eso se hizo en un PR propio (E1) y no como
parte de la pantalla de permisos.

## Opciones consideradas

1. **Área propia para el coordinador** (nueva ruta, layout y menú). Ventajas: separación
   total. Desventajas: duplica layout y menú sin que el backend distinga los roles en `/admin`;
   más código y más rutas que mantener.
2. **Misma área que `ADMINISTRATIVO`, con el conjunto de roles en una constante.** Ventajas:
   refleja lo que ya permite el backend; cambio de pocas líneas; un solo lugar para el
   conjunto. Desventajas: el menú es estático y no filtra por rol, así que el coordinador ve las
   mismas entradas que el administrativo.
3. **Agregar `COORDINADOR_PSI` solo dentro del PR 2.** Ventajas: un PR menos. Desventajas:
   mezcla un cambio transversal de enrutamiento con una pantalla y obliga a revisar ambos juntos.

## Decisión

Opción 2:

- `USER_ROLE.COORDINADOR_PSI = 'COORDINADOR_PSI'` y su etiqueta «Coordinación de psicología»
  en `authTypes.js` (`USER_ROLE_LABEL`). El texto es provisional (copy).
- `ROLE_HOME_PATH[COORDINADOR_PSI] = '/app/administrativo'` en `roleRoutes.js`.
- `ADMIN_AREA_ROLES = Object.freeze([ADMINISTRATIVO, COORDINADOR_PSI])` en `AppRouter.jsx`, usada
  como `allowedRoles` del bloque administrativo. Es el lugar único de ese conjunto: si el
  backend acepta otro rol en `/admin`, se agrega ahí. No se exporta: exportar una constante desde
  un archivo de componentes incumple `react-refresh/only-export-components`.
- Un rol que el frontend no conoce sigue sin cambios: `getHomePathForRole` devuelve `/login`. Es
  el comportamiento anterior y no se corrige aquí.
- Cubierto con pruebas de `getHomePathForRole`, `getRoleLabel`, `AppRouter` (las rutas
  administrativas exigen ambos roles) y `RequireAuth` (el coordinador entra a la ruta
  administrativa; no entra a una de estudiante y vuelve a `/app/administrativo`; el estudiante
  sigue sin entrar a la administrativa).

## Consecuencias

- **Lo que cambia:** el coordinador llega al mismo `/app/administrativo`, con el mismo
  `AdminLayout` y menú. Todo rol nuevo del backend debe agregarse a `USER_ROLE`, a
  `USER_ROLE_LABEL` y a `ROLE_HOME_PATH`; si falta, el login lo manda a `/login`.
- **Lo que queda pendiente o como deuda:**
  - Un rol desconocido hace login, `/app` lo manda a `/login` y la sesión queda abierta (bucle).
    Hay que resolverlo aparte.
  - La guarda de la pantalla de permisos, solo para `COORDINADOR_PSI`, la redirección de un
    `ADMINISTRATIVO` que escriba esa URL y el enlace «Permisos» quedan para el PR 2 de FE-336.
    Hasta entonces `ADMIN_AREA_ROLES` no distingue entre los dos roles.
  - `ADMIN_NAV_ITEMS` es estático: no hay menú distinto por rol.
  - Algunos textos dicen «rol administrativo» y ahora los puede leer el coordinador (por ejemplo
    `features/administracion/types/readOnlyRestriction.js`); su copy se revisa aparte.
- **Cuándo revisarla:** si el backend separa permisos entre `ADMINISTRATIVO` y `COORDINADOR_PSI`
  en rutas `/admin`; si se necesita menú o contenido distinto por rol; o al tratar el caso del
  rol desconocido.

## Referencias

- Brief `FE-336b_brief.md`: D1 y D3, enmiendas E1 y E2. HU #336, RF-04.
- Rama `feat/336-fe-rol-coordinador-psi`.
- Backend en `origin/develop` (`5fb7566`): `ADMINISTRATIVO` y `COORDINADOR_PSI` aceptados en
  las rutas `/admin`.
- Archivos: `src/features/users/types/authTypes.js`, `src/app/router/roleRoutes.js`, `src/app/router/AppRouter.jsx`, `src/app/router/roleRoutes.test.js`,
  `src/app/router/AppRouter.test.jsx` y `src/app/router/RequireAuth.test.jsx`.
- Guarda de permisos: D26 de `FE-336_brief.md` (PR 2 de FE-336).
