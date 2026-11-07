import { useEffect, useReducer } from 'react';

import { crearFlujoGrupal } from '../../../api/arbol/crearFlujoGrupal.js';
import { listarFlujos } from '../../../api/arbol/listarFlujos.js';
import { obtenerCatalogos } from '../../../api/arbol/obtenerCatalogos.js';
import {
  describirErrorAdmin,
  mapFlujo,
  mapListadoFlujos,
  validarNombreFlujo,
} from '../../../services/flujosAdmin.js';
import { MODALIDAD } from '../../../types/estadosChat.js';
import {
  groupTreesReducer,
  initialGroupTreesState,
} from '../utils/groupTreesState.js';

const PAGE_SIZE = 10;

async function cargarListado(dispatch, { estado, page }, estaCancelado) {
  try {
    const respuesta = await listarFlujos({
      modalidad: MODALIDAD.GRUPAL,
      estado,
      page,
      pageSize: PAGE_SIZE,
    });

    if (!estaCancelado()) {
      dispatch({ type: 'LOADED', listado: mapListadoFlujos(respuesta) });
    }
  } catch (error) {
    if (!estaCancelado()) {
      dispatch({ type: 'LOAD_ERROR', message: describirErrorAdmin(error) });
    }
  }
}

export function useGroupTreesPage() {
  const [state, dispatch] = useReducer(
    groupTreesReducer,
    initialGroupTreesState,
  );
  const { estado, page, reloadKey } = state;

  useEffect(() => {
    let cancelado = false;

    cargarListado(dispatch, { estado, page }, () => cancelado);

    return () => {
      cancelado = true;
    };
  }, [estado, page, reloadKey]);

  // Los estados del filtro salen del catálogo del backend. Si falla, se
  // conservan los del enum local: no bloquea la pantalla.
  useEffect(() => {
    let cancelado = false;

    obtenerCatalogos()
      .then((catalogos) => {
        const estados = catalogos.enums.estado_flujo;

        if (!cancelado && Array.isArray(estados) && estados.length > 0) {
          dispatch({ type: 'CATALOG', estados });
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  async function createFlow() {
    const mensajeNombre = validarNombreFlujo(state.nombre);

    if (mensajeNombre) {
      dispatch({ type: 'NAME_ERROR', message: mensajeNombre });
      return;
    }

    dispatch({ type: 'CREATE_START' });

    try {
      const creado = mapFlujo(
        await crearFlujoGrupal({ nombre: state.nombre.trim() }),
      );

      dispatch({
        type: 'CREATE_OK',
        message: `Flujo «${creado.nombre}» creado como borrador (versión ${creado.version}).`,
      });
    } catch (error) {
      dispatch({ type: 'CREATE_ERROR', message: describirErrorAdmin(error) });
    }
  }

  return {
    ...state,
    changeNombre: (nombre) => dispatch({ type: 'NAME_CHANGE', nombre }),
    createFlow,
    changeEstado: (valor) =>
      dispatch({ type: 'FILTER', estado: valor, page: 1 }),
    changePage: (nueva) => dispatch({ type: 'FILTER', estado, page: nueva }),
    retry: () => dispatch({ type: 'RELOAD' }),
  };
}
