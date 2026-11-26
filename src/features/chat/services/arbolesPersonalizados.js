import { ESTADO_FLUJO } from '../types/estadoFlujo.js';

// Acciones que la interfaz ofrece sobre la última versión de una combinación.
export const ACCION_ARBOL = Object.freeze({
  CREAR: 'CREAR',
  NUEVA_VERSION: 'NUEVA_VERSION',
  PUBLICAR: 'PUBLICAR',
  ARCHIVAR: 'ARCHIVAR',
});

// El backend entrega las versiones agrupadas por combinación; la lista de
// la interfaz trabaja con los flujos sueltos.
export function aplanarVersiones(combinaciones) {
  return combinaciones.flatMap((combinacion) =>
    Array.isArray(combinacion.versiones) ? combinacion.versiones : [],
  );
}

// Qué se puede hacer según el estado de la última versión (RF-25C):
// - sin árbol: crear el primer borrador
// - borrador: publicarlo
// - publicado: crear una nueva versión o archivarlo
// - archivado: crear una nueva versión
// Si una regla del backend lo impide, el backend responde con su mensaje.
export function accionesDisponibles(tree) {
  if (!tree) return [ACCION_ARBOL.CREAR];

  switch (tree.estado) {
    case ESTADO_FLUJO.BORRADOR:
      return [ACCION_ARBOL.PUBLICAR];
    case ESTADO_FLUJO.PUBLICADO:
      return [ACCION_ARBOL.NUEVA_VERSION, ACCION_ARBOL.ARCHIVAR];
    case ESTADO_FLUJO.ARCHIVADO:
      return [ACCION_ARBOL.NUEVA_VERSION];
    default:
      return [];
  }
}

// Nombre del borrador que se crea: lo fija el frontend a partir de la
// combinación para no pedir un dato que el flujo no necesita.
export function nombreArbolPersonalizado(label) {
  return `Personalizado · ${label}`;
}

export const MENSAJE_ACCION_ARBOL = Object.freeze({
  [ACCION_ARBOL.CREAR]: 'Borrador creado.',
  [ACCION_ARBOL.NUEVA_VERSION]: 'Nueva versión creada como borrador.',
  [ACCION_ARBOL.PUBLICAR]: 'Árbol publicado.',
  [ACCION_ARBOL.ARCHIVAR]: 'Árbol archivado.',
});
