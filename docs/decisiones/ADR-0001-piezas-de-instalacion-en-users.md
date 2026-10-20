# ADR-0001 — Piezas de instalación dentro de la feature users

**Estado:** Propuesta
**Fecha:** 2026-10-16
**Tarea de origen:** FE-M01-HOME · enmienda D11
**Decidió:** Sebastián, responsable de la tarea (a partir del plan del planner)
**Afecta a:** `src/features/users/`, futuras features que quieran ofrecer la instalación

## Contexto

La Home pública (`pages/SplashPage/`) ahora ofrece «Instalar Brisa»: un botón, una hoja con instrucciones por plataforma, un hook que decide el modo, la detección de plataforma y los textos. El brief proponía una feature nueva `src/features/install-app/` (sección 4.1, punto 2) porque la pieza se reutilizará en la fase PWA y quizás en el perfil.

`CLAUDE.md` es explícito: «Las features NO se importan entre sí. Si dos features necesitan algo, va a `shared/`» y «Un componente solo sube a `shared/` cuando lo usan 2 o más features». Hoy solo la usa la Home, que pertenece a `users`. Una feature `install-app` separada obligaría a `users` a importarla, y eso rompe la regla. Que hoy ocurra entre `users` y `cronograma` no lo vuelve válido.

## Opciones consideradas

1. **Feature nueva `install-app`.** Ventajas: aislamiento y reutilización a futuro. Desventajas: `users` tendría que importar otra feature (prohibido) y se crearía una feature sin dominio propio.
2. **Directo en `shared/`.** Ventajas: reutilizable. Desventajas: hoy lo usa una sola feature, y `CLAUDE.md` pide 2 o más; además prohíbe tocar `shared/` en una rama de feature sin un PR aparte.
3. **Dentro de `src/features/users/`.** Ventajas: cumple las reglas, no hay imports entre features y el diff queda junto a la Home. Desventajas: habrá que moverlo si otra feature lo necesita.

## Decisión

Se elige la opción 3. Todas las piezas viven en `src/features/users/`, con commits de scope `feat(users)`:

- `types/installInstructions.js`: textos por plataforma, modelados como datos.
- `utils/installPlatform.js`: detección de plataforma como función pura.
- `hooks/useInstallPrompt.js`: decide el modo (`instalada` o `instrucciones`).
- `components/InstallAppButton/`: botón (solo presentación).
- `components/InstallSheet/`: hoja de instrucciones, con la lógica pura en `installSheetLogic.js`.

No se crea la feature `install-app`.

## Consecuencias

- **Lo que cambia:** la instalación queda como parte de `users`; no hay imports entre features.
- **Lo que queda pendiente o como deuda:** si otra feature necesita el botón o la hoja, hay que subirlos a `shared/` en un PR aparte y pequeño.
- **Cuándo revisarla:** cuando una segunda feature necesite estas piezas (por ejemplo, el perfil) o cuando se implemente la fase PWA y el hook crezca.

## Referencias

- Brief FE-M01-HOME: enmienda D11 (reemplaza 4.1 punto 2, 4.2, 5 fila architect, 6.2 y 7) y D17.
- `CLAUDE.md`: sección «Arquitectura — NO NEGOCIABLE».
- Commits de la rama `feat/m01-home-instalar` (por ejemplo, `f80f4a8`, `6ad05e7`, `9f8f477`).
