# ADR-0004 — Errores: el backend decide, la interfaz presenta

**Estado:** Propuesta
**Fecha:** 2026-11-07
**Tarea de origen:** FE-SH-01 · enmienda D1
**Decidió:** Samuel (líder), regla D1; Sebastián, responsable de la tarea FE-SH-01
**Afecta a:** todas las features del frontend; `src/shared/utils/apiError.js`; `src/shared/components/ui/ApiErrorMessage/`

## Contexto

Samuel fijó la regla: «el front no maneja excepciones; su interfaz se diseña para consumir los errores del back». Hoy cada feature normaliza sus errores por su cuenta. El chat lo hace en `toChatApiError` (`src/features/chat/api/chatApiUtils.js`) y escribe sus propios textos. `apiClient.jsx` no normaliza nada. Sin una regla común, cada feature inventa códigos y mensajes, y el mismo error se ve distinto según la pantalla.

## Opciones consideradas

1. **Cada feature normaliza el error y escribe sus textos.** Es lo que hace hoy el chat. Ventajas: ninguna tarea transversal. Desventajas: los textos y los reintentos divergen, y el frontend termina fabricando errores.
2. **Utilidad compartida y componente compartido.** `toApiError` en `shared/utils/` normaliza, y `ApiErrorMessage` en `shared/components/ui/` presenta. Ventajas: una sola regla y una sola forma de error. Desventajas: hay que migrar las features que ya tienen su propia normalización.

## Decisión

Se elige la opción 2, con estas reglas:

- **D1. El frontend no fabrica errores.** El texto visible es el `mensaje` del cuerpo de error del backend. Mientras se resuelve A-020, se acepta `message` como respaldo.
- **D2. Solo dos textos propios**, para cuando no hay mensaje que mostrar:
  - `SIN_CONEXION` (sin respuesta del servidor): «No hay conexión. Revisa tu internet e inténtalo de nuevo.»
  - `DESCONOCIDO` (respuesta sin `mensaje`): «Ocurrió un error inesperado. Inténtalo de nuevo.»
- **D3. Reintentar solo** si no hubo respuesta o el estado HTTP es 5xx. Nunca ante un 4xx.
- **D4. Forma normalizada** `{ status, codigo, mensaje, campo, reintentable }`, con los nombres del cuerpo de error del backend. La produce `toApiError` (`src/shared/utils/apiError.js`) y la muestra `ApiErrorMessage` (`src/shared/components/ui/ApiErrorMessage/`).

## Consecuencias

- **Lo que cambia:** toda feature nueva muestra errores con `toApiError` y `ApiErrorMessage`. No escribe textos de error propios.
- **Lo que queda pendiente o como deuda:**
  - El chat migra a la utilidad compartida en su propia tarea. Hasta entonces `toChatApiError` sigue vigente.
  - La adopción por cada dueño de feature es A-036 en `docs/specs/ACLARACIONES.md`.
  - El llamador debe filtrar las peticiones canceladas (`axios.isCancel` o `AbortController`) antes de llamar a `toApiError`. Cualquier error sin `response` se toma como `SIN_CONEXION`.
  - La marca de normalizado (un `Symbol` no enumerable) se pierde si el objeto se copia con spread.
- **Cuándo revisarla:** si el backend cambia la forma de su cuerpo de error (Etapa 2), o cuando se resuelva A-020.

## Referencias

- Brief FE-SH-01, sección 0.1 (D1 a D4) y enmienda D1 de la sección 0.3.
- `docs/specs/ACLARACIONES.md`: A-020 (nombre del campo del mensaje) y A-036 (adopción por cada feature).
- ADR-0002, para el criterio de pruebas de los componentes de `shared/`.
