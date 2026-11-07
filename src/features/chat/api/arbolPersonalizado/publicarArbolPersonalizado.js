import { operarArbol } from './operarArbol.js';

// RF-25C: POST /chat/administracion/arboles-personalizados/:id_flujo/publicar.
export const publicarArbolPersonalizado = (idFlujo) =>
  operarArbol(idFlujo, 'publicar');
