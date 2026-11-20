# ADR-0005 — Sin operación offline en la app

**Estado:** Aceptada
**Fecha:** 2026-11-19
**Tarea de origen:** FE-M03-05 · enmienda D17
**Decidió:** líder del proyecto
**Afecta a:** feature `chat` (M03), `CLAUDE.md`, `docs/SDD_contrato_especificacion.md`,
fichas de `docs/specs/M03/`, backend (contratos 5, 7.1 y 7.2) y la HU #262 en Taiga

## Contexto

La Especificación de Requerimientos (RF-33 v1.1, RF-34, RF-34B y RF-35) pedía que el chat
funcionara sin conexión: precarga del árbol y de los recursos multimedia en el dispositivo,
cola local de interacciones y sincronización posterior. La HU #262 tenía una subtarea para
ello. En el frontend existían ya constantes de esos contratos (`ESTADO_SINCRONIZACION`,
`RESULTADO_SINCRONIZACION`, `ESTADO_PRECARGA`, `ESTADO_CONECTIVIDAD` en
`src/features/chat/types/estadosChat.js`) y el estado `NO_DISPONIBLE_OFFLINE` de RF-33, sin
uso real.

## Opciones consideradas

1. **Implementar la operación offline según RF-34, RF-34B y RF-35.** Ventajas: cumple la
   especificación. Desventajas: caché local, cola de sincronización y nuevos contratos en
   frontend y backend, con un costo alto para el tiempo del proyecto.
2. **Eliminar la operación offline.** Ventajas: alcance acotado, sin caché ni sincronización.
   Desventajas: sin conexión la conversación no avanza y los medios muestran un aviso.

## Decisión

Opción 2, por decisión del líder (2026-11-19). Se eliminan RF-34, RF-34B y RF-35 y la
subtarea offline de la HU #262. La decisión prevalece sobre el texto de RF-33 v1.1 en lo que
toca a offline, aunque la Especificación aún no lo refleje.

- Sin conexión no hay comportamiento especial: un medio que falla consume la recarga única
  del nodo (A-017) y queda en `ERROR_CARGA` con «No fue posible cargar el contenido
  multimedia.». Los errores de red de la API siguen como hasta ahora (`SIN_CONEXION`).
- `NO_DISPONIBLE_OFFLINE` se retira de `ESTADO_RENDER`. `recursos_no_presentados` queda
  fuera de alcance.
- `conectividad: 'EN_LINEA'` se sigue enviando en el POST de respuestas porque es parte del
  contrato del backend (A-025).

## Consecuencias

- **Lo que cambia:** RF-33 deja de depender de RF-34 y RF-34B. `idRecurso` deja de ser
  necesario en el bloque multimedia (A-055); `tamanoBytes` se sigue pidiendo para `CORRUPTO`.
- **Lo que queda pendiente o como deuda:** un PR de limpieza (`chore: retirar offline`) que
  quite las constantes de offline de `estadosChat.js` y su prueba, y las referencias a
  offline y a la ruta del Excel en `CLAUDE.md`, el SDD, `RF-26.md`, `RF-27.md` y A-025.
  Actualizar la Especificación de Requerimientos y Taiga queda a cargo del líder.
- **Cuándo revisarla:** si el líder o el equipo de psicología vuelven a pedir uso sin conexión.

## Referencias

- `docs/specs/ACLARACIONES.md`: A-062 (decisión), A-055, A-025.
- `docs/specs/M03/RF-33.md`: estados, CA y RNF marcados como eliminados.
- Brief FE-M03-05, sección 0.3, enmienda D17.
