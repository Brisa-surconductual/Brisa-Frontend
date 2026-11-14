import { useEffect, useReducer } from 'react';
import { useParams } from 'react-router-dom';

import { actualizarNodo } from '../../../api/arbol/actualizarNodo.js';
import { archivarFlujo } from '../../../api/arbol/archivarFlujo.js';
import { crearNodo } from '../../../api/arbol/crearNodo.js';
import { obtenerArbolFlujo } from '../../../api/arbol/obtenerArbolFlujo.js';
import { obtenerCatalogos } from '../../../api/arbol/obtenerCatalogos.js';
import { publicarFlujo } from '../../../api/arbol/publicarFlujo.js';
import {
  ACCION_FLUJO,
  accionesEstadoDisponibles,
  describirErrorAdmin,
  mapArbol,
  MENSAJE_ACCION_FLUJO,
} from '../../../services/flujosAdmin.js';
import {
  opcionesTipoNodo,
  payloadActualizarNodo,
  payloadCrearNodo,
  validarNodo,
} from '../../../services/nodosAdmin.js';
import { ESTADO_FLUJO } from '../../../types/estadoFlujo.js';
import {
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
  const { reloadKey, editor, arbol } = state;

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
            contenidosCronograma: catalogos.contenidos_cronograma ?? [],
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  async function submitEditor() {
    const errors = validarNodo(editor.values);

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'EDITOR_INVALID', errors });
      return;
    }

    const esEdicion = editor.mode === 'edit';
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

    dispatch({ type: 'EDITOR_SAVING' });

    try {
      if (esEdicion) {
        await actualizarNodo(editor.nodo.id, cambios);
      } else {
        await crearNodo(flowId, payloadCrearNodo(editor.values));
      }

      dispatch({
        type: 'EDITOR_SAVED',
        message: esEdicion ? 'Nodo actualizado.' : 'Nodo creado.',
      });
    } catch (error) {
      dispatch({
        type: 'EDITOR_SAVE_ERROR',
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
    closeEditor: () => dispatch({ type: 'EDITOR_CLOSE' }),
    changeField: (field, value) =>
      dispatch({ type: 'EDITOR_CHANGE', field, value }),
    submitEditor,
    solicitarCambioEstado: (accion) =>
      dispatch({ type: 'ESTADO_CONFIRM_OPEN', accion }),
    cancelarCambioEstado: () => dispatch({ type: 'ESTADO_CONFIRM_CLOSE' }),
    confirmarCambioEstado: () => cambiarEstado(state.confirmEstado),
  };
}
