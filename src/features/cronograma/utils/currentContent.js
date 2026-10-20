export function formatAvailability(start, end) {
  if (!start || !end) {
    return '';
  }

  return `${new Date(start).toLocaleString()} → ${new Date(end).toLocaleString()}`;
}

export function mapCurrentContent(content) {
  return {
    id: content.id_contenido,
    associationId: content.id_contenido_cronograma,
    name: content.nombre_contenido,
    type: content.tipo_contenido,
    temporalUnitId: content.id_unidad_temporal,
    temporalUnitName: content.nombre_unidad,
    temporalUnitOrder: content.orden_unidad,
    order: content.orden_contenido,
    status: content.estado_disponibilidad,
    availabilityText: formatAvailability(
      content.fecha_inicio_disponibilidad,
      content.fecha_fin_disponibilidad,
    ),
  };
}