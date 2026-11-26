# RF-25C · Gestión del árbol conversacional personalizado

- **Versión del RF que se implementa:** 1.0 (hoja M03 del Excel)
- **Módulo / feature:** M03 · `chat`
- **Rol(es) que lo usan:** ADMINISTRATIVO
- **Ruta:** `/app/administrativo/chat/arboles` (pestaña «Árboles»)
- **Contrato de API:** JSON real del backend, base `/chat/administracion/arboles-personalizados`. A diferencia de RF-25, **las respuestas no vienen envueltas en `{ data }`**.
- **Dependencias:** RF-25 (misma estructura de nodos y transiciones), RF-25B (modalidad), RF-24B (perfil clínico)

## Operaciones del backend

| Operación | Método y ruta | Estado en el frontend |
|---|---|---|
| Crear borrador | `POST /` con `{ nombre, modalidad: "PERSONALIZADA", tipo_dependencia, tipo_craving }` | Hecho |
| Listar | `GET /` → `{ combinaciones: [{ tipo_dependencia, tipo_craving, publicado, versiones }] }` (siempre las cuatro combinaciones) | Hecho |
| Nueva versión | `POST /:id_flujo/nueva-version` → flujo | Hecho |
| Publicar | `POST /:id_flujo/publicar` → flujo | Hecho |
| Archivar | `POST /:id_flujo/archivar` → flujo | Hecho |
| Árbol publicado de un perfil | `GET /publicado?tipo_dependencia&tipo_craving` | Pendiente |
| Detalle del árbol | `GET /:id_flujo` → `{ flujo, nodos, transiciones }` | Pendiente |
| Auditoría | `GET /:id_flujo/auditoria` → lista de `{ id_auditoria, id_flujo, id_actor, accion, id_objeto, fecha_operacion }` | Pendiente |
| Eliminar | `DELETE /:id_flujo` | **Nunca se llama**: el backend siempre lo rechaza; los árboles se archivan |

## Comportamiento esperado (esta entrega)

1. Al entrar se consulta `GET /` y se muestra, por cada una de las cuatro combinaciones de dependencia y craving, la **última versión** con su estado, nombre y versión.
2. Las acciones dependen del estado de esa última versión:
   - sin árbol: «Crear borrador»
   - BORRADOR: «Publicar»
   - PUBLICADO: «Nueva versión» y «Archivar»
   - ARCHIVADO: «Nueva versión»
3. «Publicar» y «Archivar» piden confirmación; «Crear borrador» y «Nueva versión» no, porque solo generan un borrador.
4. El nombre del borrador lo fija el frontend: `Personalizado · <combinación>`.
5. Las operaciones envían cuerpo `{}` (nunca `null`).
6. Al terminar una acción se avisa y se vuelve a consultar el listado; si falla, se muestra el mensaje del backend.
7. No hay ninguna acción de eliminar.

## Criterios de aceptación

- **CA-25C-1.** Dado un administrador, cuando abre `/app/administrativo/chat/arboles`, entonces ve las cuatro combinaciones con el estado de su última versión.
- **CA-25C-2.** Dada una combinación sin árboles, entonces se ofrece «Crear borrador» y se envía el perfil de esa combinación.
- **CA-25C-3.** Dado un borrador, cuando se confirma «Publicar», entonces se llama a `/publicar` y el listado se actualiza.
- **CA-25C-4.** Dado un árbol publicado, entonces se ofrece «Nueva versión» y «Archivar» (con confirmación).
- **CA-25C-5.** Dado un error del backend en cualquier acción, entonces se muestra su mensaje y no se pierde el listado.
- **CA-25C-6.** Ninguna pantalla ofrece eliminar un árbol.

## Privacidad

Esta pantalla es administrativa y muestra el perfil clínico de la **combinación** (no de una persona). El estudiante nunca ve el perfil clínico (RF-24B, RF-26B).

## Fuera de alcance de esta entrega

Detalle del árbol personalizado (nodos y transiciones), árbol publicado por perfil y auditoría. La edición de nodos y transiciones de un árbol personalizado reutilizará las pantallas de RF-25, con las rutas de este grupo.

## Aclaraciones pendientes

Ver `docs/specs/ACLARACIONES.md`: A-011 y A-012.

## Trazabilidad

| Elemento | Archivo |
|---|---|
| Llamadas al backend | `src/features/chat/api/arbolPersonalizado/` (un archivo por endpoint) |
| Reglas de acciones | `src/features/chat/services/arbolesPersonalizados.js` |
| Pantalla conectada, hook y reducer | `src/features/chat/pages/PersonalizedTreesPage/` (`PersonalizedTreesScreen`) |
| Vista | `PersonalizedTreesPage` y `components/PersonalizedTreesList` |
| Ruta | `src/app/router/AppRouter.jsx` |
| Pruebas | `*.test.js` y `*.test.jsx` junto a cada archivo anterior |
