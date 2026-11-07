import { operarArbol } from './operarArbol.js';

// RF-25C: POST /chat/administracion/arboles-personalizados/:id_flujo/nueva-version.
// Copia el árbol en un borrador nuevo con la siguiente versión.
export const crearNuevaVersionArbol = (idFlujo) =>
  operarArbol(idFlujo, 'nueva-version');
