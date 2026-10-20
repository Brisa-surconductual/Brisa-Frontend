# ADR-0002 — Pruebas de diálogos sin jsdom ni Testing Library

**Estado:** Propuesta
**Fecha:** 2026-10-16
**Tarea de origen:** FE-M01-HOME · enmienda D12
**Decidió:** Sebastián, responsable de la tarea (a partir del plan del planner)
**Afecta a:** pruebas del repo (`vitest.config.js`, `package.json`, `package-lock.json`), todo el equipo

## Contexto

El brief pedía probar la hoja `InstallSheet` con Escape, retorno de foco, atrapado de Tab y clic en pestañas (sección 6.1, punto 4). Vitest corre hoy en entorno `node`, sin `jsdom` ni Testing Library. Agregarlos toca `package.json` y el lockfile y cambia el entorno de pruebas de todo el equipo, lo que excede una tarea de pantalla.

## Opciones consideradas

1. **Agregar `jsdom` y Testing Library dentro de esta tarea.** Ventajas: se prueban todas las interacciones. Desventajas: cambia dependencias y el entorno de pruebas de todos, y el PR de la Home deja de ser pequeño.
2. **Extraer la lógica a funciones puras y probar el markup renderizado a texto; dejar lo demás a prueba manual.** Ventajas: sin dependencias nuevas, PR pequeño. Desventajas: Escape, retorno de foco y clic en pestañas no tienen prueba automática.
3. **No probar la hoja.** Desventajas: sin red de seguridad en un diálogo accesible.

## Decisión

Se elige la opción 2. La lógica del diálogo sale a funciones puras en `src/features/users/components/InstallSheet/installSheetLogic.js` y se prueba en `installSheetLogic.test.js`: trampa de Tab (`getTrapTarget`), pestaña inicial e intro a mostrar. `InstallSheet.test.jsx` verifica el markup: `role="dialog"`, `aria-modal`, `aria-labelledby` y las pestañas.

Escape, retorno de foco y clic en pestañas quedan cubiertos por la prueba manual 6.4 del brief y por la revisión del `a11y-architect`.

Se propone, como tarea aparte, agregar `jsdom` y Testing Library al repo.

## Consecuencias

- **Lo que cambia:** no hay dependencias nuevas; la lógica del diálogo es testeable en `node`.
- **Lo que queda pendiente o como deuda:** sin prueba automática de Escape, retorno de foco y clic en pestañas. Cualquier regresión ahí solo la detecta la prueba manual.
- **Cuándo revisarla:** cuando se apruebe la tarea de `jsdom` + Testing Library, o cuando otro diálogo del repo necesite pruebas de interacción. Entonces se escriben las pruebas faltantes y este ADR pasa a «Reemplazada».

## Referencias

- Brief FE-M01-HOME: enmienda D12 (reemplaza 6.1 punto 4) y sección 6.4.
- Archivos: `src/features/users/components/InstallSheet/installSheetLogic.js`, `installSheetLogic.test.js`, `InstallSheet.test.jsx`.
