# BRISA — Entrega de interfaces M03 y pendientes de integración

**Destino sugerido en el repositorio frontend:** `docs/ENTREGA_M03_INTEGRACION.md`  
**Rama de trabajo frontend:** `feat/m03-frontend`  
**Commits:** `1efb532` (RF-25B) y `8a8345d` (RF-25C)  
**Destinatario:** responsable de integración frontend–backend y equipo responsable de datos/backend.

## 1. Alcance entregado

### RF-25B — Habilitación de modalidad personalizada

- Interfaz administrativa disponible en `/app/administrativo/chat/modalidad`.
- Tarjeta de elegibilidad, indicadores de perfiles completos, validaciones, advertencias y diálogo de confirmación.
- Componentes preparados para recibir `eligibility`, `isLoading`, `error` y `onEnableModality` mediante props.
- No se implementaron peticiones HTTP ni persistencia en frontend; esas acciones corresponden a integración.

### RF-25C — Consulta de árboles personalizados

- Interfaz administrativa disponible en `/app/administrativo/chat/arboles`.
- Listado de las cuatro combinaciones clínicas (`ABSTINENCIA_FISICA`/`TOLERANCIA` × `POSITIVO`/`NEGATIVO`), con estado, versión y nombre cuando están disponibles.
- `PersonalizedTreesPage` recibe `trees`, `isLoading` y `error` mediante props.
- La implementación frontend entregada es **de consulta**. No incluye creación, edición, publicación, archivado ni editor visual completo.

### RF-25 — Árbol grupal

- **No se implementó un editor frontend**. El documento de tareas indica carga inicial mediante SQL como alternativa del MVP y editor visual de baja prioridad.

## 2. Integración pendiente (responsable frontend–backend)

**Autenticación:** usar la sesión administrativa existente, el cliente HTTP compartido y la política CSRF correspondiente; no introducir otro mecanismo de autenticación. Mantener las rutas bajo autorización `ADMINISTRATIVO`.

**RF-25B**

1. Obtener un `id_programa` real desde el contexto o selección de programa (la vista actual no ofrece selector).
2. Consultar `GET /chat/admin/modalidad/elegibilidad?id_programa=<ID>`.
3. Entregar directamente a `ProgramModalityPage` el objeto retornado: `{ id_programa, modalidad_actual, total_usuarios_activos, con_perfil_completo, sin_perfil_completo, elegible }`.
4. Implementar `onEnableModality(idPrograma)` mediante `POST /chat/admin/modalidad/habilitar-personalizada` con body `{ "id_programa": ID, "confirmacion_transicion": true }`. **No omitir** `confirmacion_transicion`.
5. Refrescar la elegibilidad después de una respuesta exitosa para mostrar `PERSONALIZADA`, deshabilitar nuevamente la acción y evitar que la tarjeta quede desactualizada. Gestionar errores de la operación.

**RF-25C**

1. Consultar `GET /chat/admin/flujos?modalidad=PERSONALIZADA&page=1&page_size=20`; la respuesta incluye `data.items[]` y `meta` (paginación).
2. Entregar `data.items` como prop `trees` a `PersonalizedTreesPage`. No entregar el sobre completo como si fuera un arreglo.
3. Verificar que se recuperen todas las versiones relevantes; paginar si corresponde. El listado actual muestra la **versión numéricamente mayor** de cada combinación, no necesariamente la versión publicada. Confirmar qué versión debe priorizarse antes de modificar ese criterio.
4. El endpoint de listado **no proporciona el número de nodos**. Si se desea mostrar ese indicador, consultar `GET /chat/admin/flujos/:id_flujo`, cuya respuesta incluye `data.nodos[]`, o acordar otro contrato. No inventar cantidades.
5. Respetar los estados reales (`BORRADOR`, `PUBLICADO`, `ARCHIVADO`). La etiqueta `SIN CREAR` es una presentación cuando no existe un flujo para la combinación en el conjunto recuperado; no debe inferirse si faltan páginas de resultados.

**Nota de contratos:** los dos endpoints de modalidad devuelven objetos JSON directos; `GET /chat/admin/flujos` devuelve `{ data: { items: [...] }, meta: {...} }`. Verificar los contratos sobre la versión de backend efectivamente desplegada.

## 3. Dependencia de datos — RF-25 y RF-25C

**Pendiente de verificación antes de validar la integración en un ambiente real:** confirmar la existencia del árbol conversacional grupal y de las cuatro combinaciones de árboles personalizados en la base de datos del ambiente correspondiente, con nodos, transiciones, versiones y estados coherentes con el alcance aprobado.

Combinaciones a comprobar:

- `ABSTINENCIA_FISICA` + `POSITIVO`
- `ABSTINENCIA_FISICA` + `NEGATIVO`
- `TOLERANCIA` + `POSITIVO`
- `TOLERANCIA` + `NEGATIVO`

Las migraciones del backend revisadas incluyen catálogo de tipos de nodo RF-25 y restricciones de versiones/auditoría RF-25C; **eso no verifica que los árboles de contenido estén sembrados en una base de datos real**. No se ejecutó SQL ni se consultó una base de datos durante la entrega frontend.

**Acción del responsable de integración:** verificar la disponibilidad de los árboles en el ambiente objetivo y, si faltan, registrar el bloqueo y coordinar la carga SQL con el encargado de backend/base de datos. Esta nota **no atribuye automáticamente al integrador la ejecución del SQL**. Solicitar confirmación y evidencia de la carga antes de declarar terminada la integración.

## 4. Alcance expresamente diferido

- Editor visual grupal RF-25: edición de nodos, transiciones y reglas.
- Editor visual personalizado RF-25C: creación, edición, versionado, publicación y archivado desde la interfaz.
- Trazabilidad administrativa RF-38, fuera de esta asignación frontend.

La postergación de editores proviene del documento `Tareas frontend M03.md` y **debe respetar lo que finalmente haya aprobado el equipo**. El listado de RF-25C no equivale a implementar la totalidad de las operaciones administrativas del requerimiento original.

## 5. Criterios mínimos para cerrar la integración

- Acceso administrativo por navegación normal a **Chat → Modalidad** y **Chat → Árboles**.
- Elegibilidad obtenida desde el backend para un programa real; confirmación de transición funcional y estado actualizado luego de la operación.
- Listado cargado desde el backend con las cuatro combinaciones y estados reales, sin fixtures o valores inventados.
- Árbol grupal y cuatro combinaciones revisados en la base de datos del ambiente; ausencias documentadas o corregidas por el responsable correspondiente.
- Errores, autenticación y permisos tratados conforme al cliente HTTP y convenciones del proyecto.

**Estado del traspaso:** interfaces frontend construidas; integración HTTP y verificación/carga SQL pendientes. No presentar la carga SQL como realizada ni el editor visual como implementado.
