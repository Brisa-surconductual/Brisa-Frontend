import { useState } from 'react';

import { resolverEstadoRender } from '../services/multimedia.js';
import { ESTADO_RENDER } from '../types/index.js';

const { CARGANDO, MOSTRADO, ERROR_CARGA } = ESTADO_RENDER;

// RF-33. El medio recibe `src` resuelto aquí y no lee `bloque.url` (D4):
// pasar a fetch + blob cuando haya CORS (A-056) cambia solo este punto.
// Con `onError`, el fallo se avisa al padre, que hace la recarga única de
// A-017; el estado local sigue en CARGANDO hasta que el bloque llegue con
// `noDisponible` o con otra URL (la `key` nueva reinicia este estado).
// Sin `onError` (nodos del historial) no hay recarga: el fallo es final.
export function useRecursoMultimedia(bloque, onError) {
  const [estadoLocal, setEstadoLocal] = useState(CARGANDO);

  return {
    src: bloque.url,
    estado: resolverEstadoRender(bloque, estadoLocal),
    onLoad: () => setEstadoLocal(MOSTRADO),
    onError: onError ?? (() => setEstadoLocal(ERROR_CARGA)),
  };
}
