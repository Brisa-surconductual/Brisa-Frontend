import { useEffect, useReducer } from 'react';

import { cambiarEstadoVariableTaxonomia } from '../../../api/taxonomia/cambiarEstadoVariableTaxonomia.js';
import { crearVariableTaxonomia } from '../../../api/taxonomia/crearVariableTaxonomia.js';
import { listarTaxonomiaVariables } from '../../../api/taxonomia/listarTaxonomiaVariables.js';
import { useAutoDismiss } from '../../../hooks/useAutoDismiss.js';
import { describirErrorAdmin } from '../../../services/flujosAdmin.js';
import {
  payloadCrearVariable,
  validarVariable,
} from '../../../services/taxonomiaVariables.js';
import {
  initialTaxonomyState,
  taxonomyReducer,
} from '../utils/taxonomyVariablesState.js';

/*
 * RF-30B: gestión de la taxonomía de variables. Lista todas (también las
 * deshabilitadas), crea variables nuevas y las habilita o deshabilita. El
 * backend rechaza deshabilitar una variable en uso por un flujo publicado
 * (409 VARIABLE_EN_USO_PUBLICADO): su `message` se muestra tal cual.
 */
export function useTaxonomyVariablesPage() {
  const [state, dispatch] = useReducer(taxonomyReducer, initialTaxonomyState);
  const { reloadKey, creacion, confirmacion } = state;

  useEffect(() => {
    let cancelado = false;

    listarTaxonomiaVariables({ incluirDeshabilitadas: true })
      .then((taxonomia) => {
        if (!cancelado) {
          dispatch({
            type: 'LOADED',
            version: taxonomia.version,
            variables: taxonomia.variables,
          });
        }
      })
      .catch((error) => {
        if (!cancelado) {
          dispatch({ type: 'ERROR', message: describirErrorAdmin(error) });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [reloadKey]);

  useAutoDismiss(state.notice, () => dispatch({ type: 'NOTICE_CLEAR' }));

  async function submitCreate() {
    const errors = validarVariable(creacion.values);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'CREATE_INVALID', errors });
      return;
    }

    dispatch({ type: 'CREATE_SAVING' });
    try {
      const { version, variable } = await crearVariableTaxonomia(
        payloadCrearVariable(creacion.values),
      );
      dispatch({
        type: 'CREATE_SAVED',
        message: `Variable «${variable.nombre}» creada. Taxonomía v${version}.`,
      });
    } catch (error) {
      dispatch({ type: 'CREATE_ERROR', message: describirErrorAdmin(error) });
    }
  }

  async function confirmToggle() {
    if (!confirmacion) return;
    const habilitar = confirmacion.habilitada === false;

    dispatch({ type: 'TOGGLE_SAVING', codigo: confirmacion.codigo });
    try {
      const { version, variable } = await cambiarEstadoVariableTaxonomia(
        confirmacion.codigo,
        habilitar,
      );
      dispatch({
        type: 'TOGGLE_SAVED',
        message: `«${variable.nombre}» ${
          habilitar ? 'habilitada' : 'deshabilitada'
        }. Taxonomía v${version}.`,
      });
    } catch (error) {
      dispatch({ type: 'TOGGLE_ERROR', message: describirErrorAdmin(error) });
    }
  }

  return {
    ...state,
    retry: () => dispatch({ type: 'RELOAD' }),
    openCreate: () => dispatch({ type: 'CREATE_OPEN' }),
    closeCreate: () => dispatch({ type: 'CREATE_CLOSE' }),
    changeCreate: (field, value) =>
      dispatch({ type: 'CREATE_CHANGE', field, value }),
    submitCreate,
    askToggle: (variable) => dispatch({ type: 'TOGGLE_ASK', variable }),
    cancelToggle: () => dispatch({ type: 'TOGGLE_CANCEL' }),
    confirmToggle,
  };
}
