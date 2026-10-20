# ADR-0003 — Versión 1.0.0 en package.json y package-lock.json

**Estado:** Propuesta
**Fecha:** 2026-10-16
**Tarea de origen:** FE-M01-HOME · enmienda D13
**Decidió:** Sebastián, responsable de la tarea (a partir del plan del planner)
**Afecta a:** `package.json`, `package-lock.json`, todo el equipo (próximos `npm install`)

## Contexto

La Home muestra «v{versión} · Universidad Surcolombiana», y el equipo decidió que la versión salga de `package.json` (decisión D9). El campo `version` estaba en `0.0.0`, el valor por defecto de Vite. Mostrar «v0.0.0» sería una referencia al desarrollo. El brief (2.5, punto 2) ya preveía este caso.

`package-lock.json` repite la versión del proyecto en dos lugares al inicio del archivo. Si solo cambia `package.json`, el lockfile queda desalineado y el próximo `npm install` de cualquier integrante genera un diff inesperado.

## Opciones consideradas

1. **Cambiar solo `package.json`.** Ventajas: un archivo menos. Desventajas: lockfile desalineado y diffs ajenos a la tarea en el siguiente `npm install`.
2. **Cambiar `package.json` y los dos `version` del inicio de `package-lock.json`.** Ventajas: coherentes; no se toca el resto del lockfile. Desventajas: un archivo más en el diff.
3. **Escribir «1.0.0» a mano en el componente.** Desventajas: se desactualiza; descartada por el brief (criterio 2.1).

## Decisión

Se elige la opción 2. La versión pasa a `1.0.0` en el campo `version` de `package.json` y en los dos `version` del inicio de `package-lock.json`. No se modifica nada más del lockfile.

La versión llega al código como `import.meta.env.VITE_APP_VERSION`: `vite.config.js` lee `package.json` con `readFileSync` e inyecta solo el texto de la versión (enmienda D14). Se lee en un solo módulo, `src/features/users/pages/SplashPage/utils/appVersion.js`, con respaldo a cadena vacía. Así no se empaqueta `package.json` completo.

Aplicada en el commit `e844f40`.

## Consecuencias

- **Lo que cambia:** la app arranca en `1.0.0` y el pie de la Home se actualiza solo al cambiar `package.json`.
- **Lo que queda pendiente o como deuda:** el equipo debe subir la versión a mano en `package.json` y en el lockfile al publicar. No hay política de versionado definida.
- **Cuándo revisarla:** al definir una política de versiones (por ejemplo, SemVer por entrega) o al implementar la fase PWA.

## Referencias

- Brief FE-M01-HOME: enmiendas D13 y D14; secciones 2.5 y 4.2.
- Commit `e844f40` (`feat(users): mostrar versión desde package.json (FE-M01-HOME)`).
- Archivos: `package.json`, `package-lock.json`, `vite.config.js`, `src/features/users/pages/SplashPage/utils/appVersion.js`.
