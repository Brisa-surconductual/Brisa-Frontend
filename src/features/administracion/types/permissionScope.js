/*
 * Permisos de acceso individual (HU-336, soporte de RF-128 a RF-131 y
 * RF-145). Los valores son los de `administrativo.alcance_permiso_enum`;
 * los códigos de error, los del contrato de la HU en Taiga (A-075).
 */

export const PERMISSION_SCOPE = Object.freeze({
  INDIVIDUAL_ACCESS: 'ACCESO_INDIVIDUAL',
  NARRATIVE_PROGRESSION: 'PROGRESION_NARRATIVA',
});

export const PERMISSION_SCOPE_LABEL = Object.freeze({
  [PERMISSION_SCOPE.INDIVIDUAL_ACCESS]:
    'Acceso individual (ficha, alertas, notificaciones y exportación)',
  [PERMISSION_SCOPE.NARRATIVE_PROGRESSION]: 'Progresión narrativa',
});

// Contrato de Taiga (A-075): códigos que la interfaz distingue.
export const PERMISSION_ERROR = Object.freeze({
  ALREADY_ACTIVE: 'PERMISO_YA_VIGENTE',
  SELF_GRANT_FORBIDDEN: 'AUTOCONCESION_NO_PERMITIDA',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANTE_NO_ENCONTRADO',
  ALREADY_REVOKED: 'PERMISO_YA_REVOCADO',
});
