# Decisiones del equipo (ADR)

Registro de las decisiones técnicas que afectan al repo compartido: arquitectura, convenciones,
dependencias, versionado, pruebas. Cada decisión es un archivo, y el archivo **no se borra**:
si una decisión cambia, se escribe otra que la reemplaza y la anterior pasa a «Reemplazada».

## Cuándo se escribe un ADR

- Cuando una decisión tomada en una tarea afecta más allá de esa tarea: otras features, otros
  integrantes, la configuración del repo o una regla de `CLAUDE.md`.
- No hace falta para decisiones de una sola pantalla o componente; esas quedan en la tarea.

## Cómo se nombra

`ADR-NNNN-titulo-corto.md`, con número consecutivo de cuatro dígitos y el título en minúsculas
con guiones. Ejemplo: `ADR-0001-imports-entre-features.md`.

## Estados

| Estado | Significado |
|---|---|
| Propuesta | Escrita, falta que el equipo la confirme |
| Aceptada | Vigente |
| Reemplazada por ADR-NNNN | Ya no aplica; se conserva por historia |
| Rechazada | Se discutió y no se adoptó; se conserva para no repetir la discusión |

## Índice

| ADR | Título | Estado | Fecha | Tarea |
|---|---|---|---|---|
| [ADR-0001](ADR-0001-piezas-de-instalacion-en-users.md) | Piezas de instalación dentro de la feature users | Propuesta | 2026-10-16 | FE-M01-HOME (D11) |
| [ADR-0002](ADR-0002-pruebas-sin-jsdom-ni-testing-library.md) | Pruebas de diálogos sin jsdom ni Testing Library | Propuesta | 2026-10-16 | FE-M01-HOME (D12) |
| [ADR-0003](ADR-0003-version-1-0-0-en-package-json.md) | Versión 1.0.0 en package.json y package-lock.json | Propuesta | 2026-10-16 | FE-M01-HOME (D13) |
