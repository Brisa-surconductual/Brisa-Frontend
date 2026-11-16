import { useState } from 'react';

import { resolverEstadoRender } from '../services/multimedia.js';
import { ESTADO_RENDER } from '../types/index.js';

// RF-33. El medio recibe `src` resuelto aquí y no lee `bloque.url` (D4):
// pasar a fetch + blob cuando haya CORS (A-056) cambia solo este punto.
// Un fallo se avisa al padre, que hace la recarga única de A-017; el
// estado local sigue en CARGANDO hasta que el bloque llegue con
// `noDisponible` o con otra URL (la `key` nueva reinicia este estado).
export function useRecursoMultimedia(bloque, onError) {
  const [cargado, setCargado] = useState(false);

  const estadoLocal = cargado ? ESTADO_RENDER.MOSTRADO : ESTADO_RENDER.CARGANDO;

  return {
    src: bloque.url,
    estado: resolverEstadoRender(bloque, estadoLocal),
    onLoad: () => setCargado(true),
    onError,
  };
}
