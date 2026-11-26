import { ASSIGNMENT_ERROR } from '../types/participantAssignment.js';

/*
 * Reglas puras de la asignación de participantes (RF-125). No deciden
 * la elegibilidad ni los conflictos: eso lo informa la fuente de datos.
 */

// Una solicitud necesita al menos un participante seleccionado.
export function validateAssignmentSelection(selectedIds) {
  return Array.isArray(selectedIds) && selectedIds.length > 0
    ? null
    : ASSIGNMENT_ERROR.EMPTY_SELECTION;
}

// Separa el catálogo según lo que informó la fuente (`issue`).
export function splitCandidates(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];

  return {
    available: list.filter(({ issue }) => !issue),
    unavailable: list.filter(({ issue }) => issue),
  };
}

// Añade o quita un identificador sin repetirlo ni mutar la selección.
export function toggleSelection(selectedIds, id) {
  return selectedIds.includes(id)
    ? selectedIds.filter((selected) => selected !== id)
    : [...selectedIds, id];
}
