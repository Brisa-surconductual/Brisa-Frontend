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

// RF-25 / RF-27B: valor que asigna un nodo de captura. Cada dimensión tiene
// dos valores excluyentes: el administrador activa uno con un interruptor.
export const VALOR_PERFIL_CLINICO = Object.freeze({
  [DIMENSION_PERFIL_CLINICO.TIPO_DEPENDENCIA]: Object.freeze([
    Object.freeze({ value: 'ABSTINENCIA_FISICA', label: 'Abstinencia física' }),
    Object.freeze({ value: 'TOLERANCIA', label: 'Tolerancia' }),
  ]),
  [DIMENSION_PERFIL_CLINICO.TIPO_CRAVING]: Object.freeze([
    Object.freeze({ value: 'POSITIVO', label: 'Positivo' }),
    Object.freeze({ value: 'NEGATIVO', label: 'Negativo' }),
  ]),
});

export function etiquetaValorPerfilClinico(dimension, valor) {
  return (
    (VALOR_PERFIL_CLINICO[dimension] ?? []).find((v) => v.value === valor)
      ?.label ?? ''
  );
}
