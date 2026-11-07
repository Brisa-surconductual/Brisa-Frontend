import { useEffect, useReducer } from 'react';

import { archivarArbolPersonalizado } from '../../../api/arbolPersonalizado/archivarArbolPersonalizado.js';
import { crearArbolPersonalizado } from '../../../api/arbolPersonalizado/crearArbolPersonalizado.js';
import { listarArbolesPersonalizados } from '../../../api/arbolPersonalizado/listarArbolesPersonalizados.js';
import { crearNuevaVersionArbol } from '../../../api/arbolPersonalizado/nuevaVersionArbolPersonalizado.js';
import { publicarArbolPersonalizado } from '../../../api/arbolPersonalizado/publicarArbolPersonalizado.js';
import {
  ACCION_ARBOL,
  aplanarVersiones,
  MENSAJE_ACCION_ARBOL,
  nombreArbolPersonalizado,
} from '../../../services/arbolesPersonalizados.js';
import { describirErrorAdmin } from '../../../services/flujosAdmin.js';
import {
  initialPersonalizedTreesState,
  personalizedTreesReducer,
} from '../utils/personalizedTreesState.js';

// Acciones que piden confirmar antes de ejecutarse.
const REQUIERE_CONFIRMACION = Object.freeze([
  ACCION_ARBOL.PUBLICAR,
  ACCION_ARBOL.ARCHIVAR,
]);

async function cargarArboles(dispatch, estaCancelado) {
  try {
    const trees = aplanarVersiones(await listarArbolesPersonalizados());

    if (!estaCancelado()) dispatch({ type: 'LOADED', trees });
  } catch (error) {
    if (!estaCancelado()) {
      dispatch({ type: 'LOAD_ERROR', message: describirErrorAdmin(error) });
    }
  }
}

function ejecutarAccion(action, { tree, combination }) {
  switch (action) {
    case ACCION_ARBOL.CREAR:
      return crearArbolPersonalizado({
        nombre: nombreArbolPersonalizado(combination.label),
        tipoDependencia: combination.dependence,
        tipoCraving: combination.craving,
      });
    case ACCION_ARBOL.NUEVA_VERSION:
      return crearNuevaVersionArbol(tree.id_flujo);
    case ACCION_ARBOL.PUBLICAR:
      return publicarArbolPersonalizado(tree.id_flujo);
    case ACCION_ARBOL.ARCHIVAR:
      return archivarArbolPersonalizado(tree.id_flujo);
    default:
      throw new Error(`Acción desconocida: ${action}`);
  }
}

export function usePersonalizedTreesPage() {
  const [state, dispatch] = useReducer(
    personalizedTreesReducer,
    initialPersonalizedTreesState,
  );
  const { reloadKey } = state;

  useEffect(() => {
    let cancelado = false;

    cargarArboles(dispatch, () => cancelado);

    return () => {
      cancelado = true;
    };
  }, [reloadKey]);

  async function run(action, target) {
    dispatch({ type: 'ACTION_START' });

    try {
      await ejecutarAccion(action, target);
      dispatch({ type: 'ACTION_OK', message: MENSAJE_ACCION_ARBOL[action] });
    } catch (error) {
      dispatch({ type: 'ACTION_ERROR', message: describirErrorAdmin(error) });
    }
  }

  // Publicar y archivar piden confirmación; crear y nueva versión no, porque
  // solo generan un borrador.
  function requestAction(action, target) {
    if (REQUIERE_CONFIRMACION.includes(action)) {
      dispatch({ type: 'CONFIRM_OPEN', action, tree: target.tree });
      return;
    }

    run(action, target);
  }

  return {
    ...state,
    requestAction,
    confirmAction: () =>
      run(state.confirm.action, { tree: state.confirm.tree }),
    cancelConfirm: () => dispatch({ type: 'CONFIRM_CLOSE' }),
    retry: () => dispatch({ type: 'RELOAD' }),
  };
}
