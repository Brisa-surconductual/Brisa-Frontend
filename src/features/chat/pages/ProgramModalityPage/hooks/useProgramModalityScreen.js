import { useEffect, useReducer } from 'react';

import { habilitarModalidadPersonalizada } from '../../../api/modalidad/habilitarModalidadPersonalizada.js';
import { obtenerElegibilidadModalidad } from '../../../api/modalidad/obtenerElegibilidadModalidad.js';
import { describirErrorAdmin } from '../../../services/flujosAdmin.js';
import { ID_PROGRAMA_ACTUAL } from '../../../types/programa.js';
import {
  initialProgramModalityState,
  programModalityReducer,
} from '../utils/programModalityState.js';

async function cargarElegibilidad(dispatch, estaCancelado) {
  try {
    const eligibility = await obtenerElegibilidadModalidad(ID_PROGRAMA_ACTUAL);

    if (!estaCancelado()) dispatch({ type: 'LOADED', eligibility });
  } catch (error) {
    if (!estaCancelado()) {
      dispatch({ type: 'LOAD_ERROR', message: describirErrorAdmin(error) });
    }
  }
}

export function useProgramModalityScreen() {
  const [state, dispatch] = useReducer(
    programModalityReducer,
    initialProgramModalityState,
  );
  const { reloadKey } = state;

  useEffect(() => {
    let cancelado = false;

    cargarElegibilidad(dispatch, () => cancelado);

    return () => {
      cancelado = true;
    };
  }, [reloadKey]);

  // La página ya pidió confirmación. Si el backend rechaza el cambio (por
  // ejemplo, perfiles incompletos) se relanza con su mensaje para mostrarlo.
  async function enableModality(idPrograma) {
    try {
      await habilitarModalidadPersonalizada(idPrograma);
    } catch (error) {
      throw new Error(describirErrorAdmin(error), { cause: error });
    }

    dispatch({ type: 'RELOAD' });
  }

  return { ...state, enableModality };
}
