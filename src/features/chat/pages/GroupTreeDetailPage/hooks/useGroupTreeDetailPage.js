import { useEffect, useReducer } from 'react';
import { useParams } from 'react-router-dom';

import { actualizarNodo } from '../../../api/arbol/actualizarNodo.js';
import { actualizarTransicion } from '../../../api/arbol/actualizarTransicion.js';
import { archivarFlujo } from '../../../api/arbol/archivarFlujo.js';
import { crearNodo } from '../../../api/arbol/crearNodo.js';
import { crearTransicion } from '../../../api/arbol/crearTransicion.js';
import { obtenerArbolFlujo } from '../../../api/arbol/obtenerArbolFlujo.js';
import { obtenerCatalogos } from '../../../api/arbol/obtenerCatalogos.js';
import { publicarFlujo } from '../../../api/arbol/publicarFlujo.js';
import { useAutoDismiss } from '../../../hooks/useAutoDismiss.js';
import { mapContenidos } from '../../../services/contenidosAdmin.js';
import {
  ACCION_FLUJO,
  accionesEstadoDisponibles,
  describirCondicionesCapturaPerfil,
  describirCondicionesCoberturaIncompleta,
  describirCondicionesGrafoInvalido,
  describirErrorAdmin,
  mapArbol,
  MENSAJE_ACCION_FLUJO,
} from '../../../services/flujosAdmin.js';
import {
  opcionesTipoNodo,
  payloadActualizarNodo,
  payloadCrearNodo,
  transicionesAfectadasPorCambio,
  validarNodo,
} from '../../../services/nodosAdmin.js';
import {
  configuracionReglaTransicion,
  destinoPorDefectoActual,
  destinosOcupadosDelOrigen,
  ordenEvaluacionSugerido,
  payloadActualizarTransicion,
  payloadCrearTransicion,
  validarTransicion,
} from '../../../services/transicionesAdmin.js';
import { ESTADO_FLUJO } from '../../../types/estadoFlujo.js';
import {
  hayCambios,
  initialTreeDetailState,
  treeDetailReducer,
} from '../utils/treeDetailState.js';

function ejecutarAccionEstado(accion, idFlujo) {
  switch (accion) {
    case ACCION_FLUJO.PUBLICAR:
      return publicarFlujo(idFlujo);
    case ACCION_FLUJO.ARCHIVAR:
      return archivarFlujo(idFlujo);
    default:
      throw new Error(`Acción desconocida: ${accion}`);
  }
}

const CODIGO_TRANSICIONES_AFECTADAS = 'TRANSICIONES_AFECTADAS';

// RF-25: transiciones afectadas listas para el diálogo de confirmación.
function describirAfectadas(transiciones, arbol) {
  const etiqueta = (id) =>
    arbol?.nodos.find((n) => n.id === id)?.etiqueta ?? 'Nodo desconocido';
  return transiciones.map((t) => ({
    id: t.id,
    origen: etiqueta(t.origenId),
    destino: etiqueta(t.destinoId),
    orden: t.ordenEvaluacion,
  }));
}

async function cargarArbol(dispatch, idFlujo, estaCancelado) {
  try {
    const arbol = mapArbol(await obtenerArbolFlujo(idFlujo));

    if (!estaCancelado()) dispatch({ type: 'LOADED', arbol });
  } catch (error) {
    if (!estaCancelado()) {
      dispatch({ type: 'ERROR', message: describirErrorAdmin(error) });
    }
  }
}

export function useGroupTreeDetailPage() {
  const { flowId } = useParams();
  const [state, dispatch] = useReducer(
    treeDetailReducer,
    initialTreeDetailState,
  );
  const { reloadKey, editor, transitionEditor, arbol } = state;

  useEffect(() => {
    let cancelado = false;

    cargarArbol(dispatch, flowId, () => cancelado);

    return () => {
      cancelado = true;
    };
  }, [flowId, reloadKey]);

  // Catálogos del backend para el selector de tipo de nodo y de contenido
  // asociado (RF-25): solo contenido ya programado en un cronograma.
  useEffect(() => {
    let cancelado = false;

    obtenerCatalogos()
      .then((catalogos) => {
        if (!cancelado) {
          dispatch({
            type: 'CATALOG',
            tiposNodo: opcionesTipoNodo(catalogos.tipos_nodo),
            contenidos: mapContenidos(catalogos.contenidos),
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  // RF-25: los avisos de éxito se cierran solos.
  useAutoDismiss(state.notice, () => dispatch({ type: 'NOTICE_CLEAR' }));

  async function submitEditor({ confirmarEliminacion = false } = {}) {
    const esEdicion = editor.mode === 'edit';
    const errors = validarNodo(editor.values, { esEdicion });

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'EDITOR_INVALID', errors });
      return;
    }

    const cambios = esEdicion
      ? payloadActualizarNodo(editor.nodo, editor.values)
      : null;

    if (esEdicion && cambios === null) {
      dispatch({
        type: 'EDITOR_SAVE_ERROR',
        message: 'No hay cambios para guardar.',
      });
      return;
    }

    // RF-25: cambiar el tipo de respuesta invalida las transiciones de
    // salida; se pide confirmación antes de eliminarlas.
    if (esEdicion && !confirmarEliminacion) {
      const afectadas = transicionesAfectadasPorCambio(
        editor.nodo,
        editor.values,
        arbol?.transiciones,
      );
      if (afectadas.length > 0) {
        dispatch({
          type: 'AFECTADAS_SOLICITAR',
          transiciones: describirAfectadas(afectadas, arbol),
        });
        return;
      }
    }

    dispatch({ type: 'EDITOR_SAVING' });

    try {
      if (esEdicion) {
        await actualizarNodo(
          editor.nodo.id,
          confirmarEliminacion
            ? { ...cambios, eliminar_transiciones_afectadas: true }
            : cambios,
        );
      } else {
        await crearNodo(flowId, payloadCrearNodo(editor.values));
      }

      dispatch({
        type: 'EDITOR_SAVED',
        message: esEdicion ? 'Nodo actualizado.' : 'Nodo creado.',
      });
    } catch (error) {
      // Red de seguridad: el backend detectó transiciones afectadas que el
      // árbol en pantalla no tenía (p. ej. otra pestaña las creó).
      if (error?.code === CODIGO_TRANSICIONES_AFECTADAS) {
        const ids = new Set(
          (error.detalles?.transiciones ?? []).map((t) => t.id_regla),
        );
        dispatch({
          type: 'AFECTADAS_SOLICITAR',
          transiciones: describirAfectadas(
            (arbol?.transiciones ?? []).filter((t) => ids.has(t.id)),
            arbol,
          ),
        });
        return;
      }
      dispatch({
        type: 'EDITOR_SAVE_ERROR',
        message: describirErrorAdmin(error),
      });
    }
  }

  // RF-25: qué regla pide el nodo origen elegido.
  const configTransicion = configuracionReglaTransicion(
    arbol?.nodos.find(
      (nodo) => nodo.id === transitionEditor.values.idNodoOrigen,
    ),
  );

  async function submitTransitionEditor() {
    const esEdicion = transitionEditor.mode === 'edit';
    const errors = validarTransicion(
      transitionEditor.values,
      configTransicion,
      // Al crear, el destino por defecto actual ya viene en `idNodoDestinoOtro`.
      destinosOcupadosDelOrigen(
        arbol?.transiciones,
        transitionEditor.values.idNodoOrigen,
        esEdicion ? transitionEditor.transicion.id : null,
      ),
    );

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'TRANSITION_EDITOR_INVALID', errors });
      return;
    }

    const cambios = esEdicion
      ? payloadActualizarTransicion(
          transitionEditor.transicion,
          transitionEditor.values,
          configTransicion,
        )
      : null;

    if (esEdicion && cambios === null) {
      dispatch({
        type: 'TRANSITION_EDITOR_SAVE_ERROR',
        message: 'No hay cambios para guardar.',
      });
      return;
    }

    dispatch({ type: 'TRANSITION_EDITOR_SAVING' });

    try {
      if (esEdicion) {
        await actualizarTransicion(transitionEditor.transicion.id, cambios);
      } else {
        await crearTransicion(
          flowId,
          payloadCrearTransicion(transitionEditor.values, configTransicion),
        );
      }

      dispatch({
        type: 'TRANSITION_EDITOR_SAVED',
        message: esEdicion ? 'Transición actualizada.' : 'Transición creada.',
      });
    } catch (error) {
      dispatch({
        type: 'TRANSITION_EDITOR_SAVE_ERROR',
        message: describirErrorAdmin(error),
      });
    }
  }

  // Publicar y archivar piden confirmación antes de ejecutarse.
  async function cambiarEstado(accion) {
    dispatch({ type: 'ESTADO_ACCION_START' });

    try {
      await ejecutarAccionEstado(accion, flowId);
      dispatch({
        type: 'ESTADO_ACCION_OK',
        message: MENSAJE_ACCION_FLUJO[accion],
      });
    } catch (error) {
      dispatch({
        type: 'ESTADO_ACCION_ERROR',
        message: describirErrorAdmin(error),
        // Solo GRAFO_INVALIDO, COBERTURA_INCOMPLETA y NODO_CAPTURA_PERFIL_INVALIDO
        // (RF-25) traen condiciones estructuradas; nunca dos a la vez, el
        // resto de errores no agrega nada aquí.
        condiciones: [
          ...describirCondicionesGrafoInvalido(error?.detalles),
          ...describirCondicionesCoberturaIncompleta(
            error?.detalles,
            arbol?.nodos,
          ),
          ...describirCondicionesCapturaPerfil(error?.detalles),
        ],
      });
    }
  }

  return {
    ...state,
    // Solo un borrador se puede editar (el backend rechaza el resto).
    canEdit: arbol?.flujo.estado === ESTADO_FLUJO.BORRADOR,
    accionesEstado: arbol ? accionesEstadoDisponibles(arbol.flujo.estado) : [],
    retry: () => dispatch({ type: 'RELOAD' }),
    openCreate: () => dispatch({ type: 'EDITOR_OPEN_CREATE' }),
    openEdit: (nodo) => dispatch({ type: 'EDITOR_OPEN_EDIT', nodo }),
    // Cancelar/Esc/clic fuera del modal: confirma solo si hay cambios.
    closeEditor: () =>
      dispatch(
        hayCambios(editor)
          ? { type: 'DESCARTE_SOLICITAR', editor: 'nodo' }
          : { type: 'EDITOR_CLOSE' },
      ),
    changeField: (field, value) =>
      dispatch({ type: 'EDITOR_CHANGE', field, value }),
    submitEditor: () => submitEditor(),
    // RF-25: confirmación del diálogo de transiciones afectadas.
    confirmarAfectadas: () => submitEditor({ confirmarEliminacion: true }),
    cancelarAfectadas: () => dispatch({ type: 'AFECTADAS_CANCELAR' }),
    openCreateTransition: () =>
      dispatch({ type: 'TRANSITION_EDITOR_OPEN_CREATE' }),
    openEditTransition: (transicion) =>
      dispatch({ type: 'TRANSITION_EDITOR_OPEN_EDIT', transicion }),
    closeTransitionEditor: () =>
      dispatch(
        hayCambios(transitionEditor)
          ? { type: 'DESCARTE_SOLICITAR', editor: 'transicion' }
          : { type: 'TRANSITION_EDITOR_CLOSE' },
      ),
    configTransicion,
    cancelarDescarte: () => dispatch({ type: 'DESCARTE_CANCELAR' }),
    confirmarDescarte: () =>
      dispatch({
        type:
          state.confirmDescarte === 'nodo'
            ? 'EDITOR_CLOSE'
            : 'TRANSITION_EDITOR_CLOSE',
      }),
    changeTransitionField: (field, value) =>
      dispatch(
        field === 'idNodoOrigen'
          ? {
              type: 'TRANSITION_EDITOR_ORIGEN',
              value,
              ordenSugerido: ordenEvaluacionSugerido(
                arbol?.transiciones,
                value,
              ),
              destinoOtro: destinoPorDefectoActual(arbol?.transiciones, value),
            }
          : { type: 'TRANSITION_EDITOR_CHANGE', field, value },
      ),
    submitTransitionEditor,
    // El árbol visual selecciona un nodo para ir directo a su edición
    // (mismo comportamiento que "Editar" en la lista de nodos).
    selectNodoEnArbol: (nodo) => dispatch({ type: 'EDITOR_OPEN_EDIT', nodo }),
    solicitarCambioEstado: (accion) =>
      dispatch({ type: 'ESTADO_CONFIRM_OPEN', accion }),
    cancelarCambioEstado: () => dispatch({ type: 'ESTADO_CONFIRM_CLOSE' }),
    confirmarCambioEstado: () => cambiarEstado(state.confirmEstado),
  };
}
