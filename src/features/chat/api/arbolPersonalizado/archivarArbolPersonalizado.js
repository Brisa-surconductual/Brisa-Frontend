import { operarArbol } from './operarArbol.js';

// RF-25C: POST /chat/administracion/arboles-personalizados/:id_flujo/archivar.
// Los árboles no se eliminan: el DELETE del backend siempre se rechaza y por
// eso la interfaz nunca lo llama.
export const archivarArbolPersonalizado = (idFlujo) =>
  operarArbol(idFlujo, 'archivar');
