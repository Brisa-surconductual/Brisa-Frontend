# Matriz de trazabilidad RF ↔ código (frontend)

Artefacto vivo de la sección 6 de `docs/SDD_contrato_especificacion.md`. Se actualiza en el mismo PR que cambia el código. Leyenda: **Cubierto** (UI + contrato + pruebas) · **Parcial** · **Pendiente** · **Fuera de alcance FE** · **Por auditar**.

Esta primera versión registra solo el chat del estudiante (M03), integrado de punta a punta el 2026-11-20. Las demás filas de la sección 6 del contrato siguen allí hasta auditarse.

| RF | Versión | Ficha | Código principal | Pruebas | Estado |
|---|---|---|---|---|---|
| RF-25 (PR 6) | 1.1 | `M03/RF-25.md` | `services/nodosAdmin.js`, `services/transicionesAdmin.js`, `services/flujosAdmin.js`, `components/ExclusiveSwitchGroup/`, `hooks/useAutoDismiss.js`, `pages/GroupTreeDetailPage/` (`NodeEditorForm`, `TransitionEditorForm`, `TreeNodeList`, `FlowTreeDiagram`, `AffectedTransitionsDialog`) | `services/usabilidadFlujo.test.js`, `FlowTreeDiagram/buildTreeLayout.test.js`, `utils/treeDetailState.test.js`, `ExclusiveSwitchGroup.test.jsx` | Cubierto (verificación manual contra el backend pendiente) |
| RF-26 | 1.1 | `M03/RF-26.md` | `api/sesion/obtenerNodoActual.js`, `services/nodoActual.js`, `components/ChatNodeMessage/` | `services/nodoActual.test.js`, `components/ChatNodeMessage/ChatNodeMessage.test.jsx` | Cubierto (verificación manual contra el backend pendiente) |
| RF-27 | 1.1 | `M03/RF-27.md` | `components/NodeInput/registroEntradas.js`, `components/NodeInputForm/` | `components/NodeInputForm/NodeInputForm.test.jsx`, `components/NodeInput/entradas.test.js` | Cubierto |
| RF-27B | 1.1 | — (sin interfaz propia) | La captura viaja en el mismo `POST` (nodo `OPCION_UNICA` con `capturaPerfil`); el frontend no muestra ni envía el perfil | Backend: `captura-perfil-respuesta.policy.spec.ts` | Fuera de alcance FE (solo envío) |
| RF-28 | 1.1 | `M03/RF-28.md` | `pages/ChatConversationPage/utils/envio.js` (`clasificarErrorEnvio`) | `utils/envio.test.js`, `utils/conversationState.test.js` | Cubierto |
| RF-29 | 1.1 | `M03/RF-29.md` | `pages/ChatConversationPage/utils/conversationState.js` | `utils/conversationState.test.js` | Cubierto |
| RF-30 | 1.1 | `M03/RF-30.md` | `api/sesion/enviarRespuesta.js`, `services/resultadoRespuesta.js`, `utils/envio.js` (`crearCuerpo`) | `api/sesion/enviarRespuesta.test.js`, `utils/envio.test.js`, `utils/conversationState.test.js` | Cubierto |
| RF-31 / RF-32 | 1.1 | `M03/RF-31.md`, `M03/RF-32.md` | `api/sesion/obtenerHistorialInteracciones.js`, `services/historialInteracciones.js`, `components/LoadEarlierButton/`, `components/HistorialConversacion/`, `pages/ChatConversationPage/components/SesionCompletada/` | `services/historialInteracciones.test.js`, `api/sesion/obtenerHistorialInteracciones.test.js`, `utils/conversationState.test.js`, `components/LoadEarlierButton/LoadEarlierButton.test.jsx`, `components/HistorialConversacion/*.test.*`, `SesionCompletada.test.jsx` | Cubierto |
| RF-33 | 1.1 | `M03/RF-33.md` | `components/ChatMediaBlock/`, `hooks/useRecursoMultimedia.js`, `selectRecursosNoPresentados` | `components/ChatMediaBlock/ChatMediaBlock.test.jsx`, `utils/conversationState.test.js` | Parcial (A-061: renovar URL del historial con la pantalla abierta) |

Rutas relativas a `src/features/chat/`.
