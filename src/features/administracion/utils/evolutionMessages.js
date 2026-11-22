// Mensajes oficiales de los flujos alternos de RF-141 v1.0.1.
export const EVOLUTION_MESSAGE = Object.freeze({
  INSUFFICIENT_UNITS:
    'La cohorte activa aún no cuenta con suficientes unidades temporales transcurridas para mostrar una evolución. La vista estará disponible a partir de la segunda unidad temporal del programa.',
  GAPS: 'Una o más unidades temporales de la serie no cuentan con datos consolidados y se representan como un vacío en la evolución.',
  NO_FILTER_RESULTS:
    'No se encontraron datos para la combinación de filtros seleccionada en ninguna unidad temporal de la cohorte.',
  NOT_FOUND:
    'No existe una cohorte activa disponible para mostrar la evolución temporal de indicadores.',
  FORBIDDEN:
    'No tiene permisos para consultar la evolución temporal de indicadores de la cohorte.',
  UNAVAILABLE:
    'El módulo de seguimiento no está disponible en este momento. No es posible construir la evolución temporal de indicadores. Intente nuevamente más tarde.',
  ERROR:
    'No fue posible construir la evolución temporal de indicadores en este momento. Intente nuevamente más tarde.',
});
