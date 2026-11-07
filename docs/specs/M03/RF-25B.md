# RF-25B · Habilitación de la modalidad terapéutica personalizada

- **Versión del RF que se implementa:** 1.0 (hoja M03 del Excel)
- **Módulo / feature:** M03 · `chat`
- **Rol(es) que lo usan:** ADMINISTRATIVO (equipo de psicología)
- **Ruta:** `/app/administrativo/chat/modalidad` (pestaña «Modalidad»)
- **Contrato de API:** JSON real del backend, base `/chat/admin/modalidad`. Las respuestas **no vienen envueltas en `{ data }`**.
- **Dependencias:** RF-24B (perfil clínico), RF-26B (selección del árbol personalizado)

## Historia

Como administrador, quiero habilitar el cambio de modalidad de un programa de grupal a personalizada, solo cuando el 100% de sus usuarios activos tengan perfil clínico completo, para no dejar a nadie sin árbol asignable.

## JSON real del backend

- `GET /chat/admin/modalidad/elegibilidad?id_programa=N` → `{ id_programa, modalidad_actual (GRUPAL, PERSONALIZADA o null), total_usuarios_activos, con_perfil_completo, sin_perfil_completo, elegible }`.
- `POST /chat/admin/modalidad/habilitar-personalizada` con `{ id_programa, confirmacion_transicion: true }` → `{ id_programa, modalidad, usuarios_actualizados, fecha_vigencia_desde, administrador_responsable }`.
- Errores de dominio, con `codigo` y `message`: `SIN_ASIGNACIONES_VIGENTES`, `MODALIDAD_NO_GRUPAL`, `SIN_PARTICIPANTES_ACTIVOS`, `PERFILES_INCOMPLETOS` (con `detalles.sin_perfil_completo`) y `TRANSICION_CONCURRENTE`. Un `id_programa` inválido responde 400.

## Comportamiento esperado

1. Al entrar se consulta la elegibilidad del programa y se muestra la tarjeta con el resumen y la lista de condiciones (modalidad actual, usuarios activos, perfiles completos).
2. «Habilitar personalizada» solo está disponible si `elegible` es `true`.
3. Antes de cambiar se pide confirmación explícita en un diálogo (cambio que afecta a todos los usuarios activos del programa).
4. Al confirmar se envía `confirmacion_transicion: true`. Si el backend rechaza el cambio, se muestra su mensaje tal cual y no se cambia nada.
5. Si el cambio se completa, se avisa y se vuelve a consultar la elegibilidad (la modalidad pasa a PERSONALIZADA).
6. La pantalla no muestra datos de ninguna persona: solo cifras del programa.

## Criterios de aceptación

- **CA-25B-1.** Dado un administrador, cuando abre la pantalla, entonces ve «Consultando elegibilidad del programa» y luego las cifras reales del backend.
- **CA-25B-2.** Dado un programa con todos los activos con perfil completo y modalidad GRUPAL, entonces «Habilitar personalizada» está disponible.
- **CA-25B-3.** Dado un programa con algún activo sin perfil completo, entonces no se ofrece habilitar y se ven las cifras.
- **CA-25B-4.** Dada la confirmación del diálogo, entonces el POST lleva `id_programa` y `confirmacion_transicion: true`.
- **CA-25B-5.** Dado un rechazo del backend (por ejemplo `PERFILES_INCOMPLETOS`), entonces se muestra su mensaje y la modalidad no cambia.
- **CA-25B-6.** Dado un cambio exitoso, entonces se muestra el aviso y la tarjeta refleja la nueva modalidad.

## Aclaraciones pendientes

Ver `docs/specs/ACLARACIONES.md`: A-013.

## Trazabilidad

| Elemento | Archivo |
|---|---|
| Llamadas al backend | `src/features/chat/api/modalidad/obtenerElegibilidadModalidad.js`, `habilitarModalidadPersonalizada.js` |
| Programa consultado | `src/features/chat/types/programa.js` |
| Pantalla conectada, hook y reducer | `src/features/chat/pages/ProgramModalityPage/` (`ProgramModalityScreen`) |
| Vista y diálogo | `ProgramModalityPage`, `components/ProgramEligibilityCard`, `components/ProgramModalityConfirmDialog` |
| Ruta | `src/app/router/AppRouter.jsx` |
| Pruebas | `*.test.js` y `*.test.jsx` junto a cada archivo anterior |
