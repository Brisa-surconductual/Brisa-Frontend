// RF-25 / RF-27B: dimensiones del perfil clínico que un nodo del árbol
// grupal puede marcar para su captura. El valor lo elige psicología al
// diseñar el árbol; nunca lo envía ni lo ve el estudiante (C-SEG-1).
export const DIMENSION_PERFIL_CLINICO = Object.freeze({
  TIPO_DEPENDENCIA: 'TIPO_DEPENDENCIA',
  TIPO_CRAVING: 'TIPO_CRAVING',
});

export const DIMENSION_PERFIL_CLINICO_ETIQUETA = Object.freeze({
  [DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA]: 'Tipo de dependencia',
  [DIMENSION_PERFIL_CLINICO.TIPO_CRAVING]: 'Tipo de craving',
});
