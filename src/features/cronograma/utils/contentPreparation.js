export function mapCatalogContent(item) {
  return {
    id: item.idContenido,
    name: item.nombre,
    type: item.tipoContenido,
    associationId: item.idAsociasionUnidadTemporalContenido,
    associated: item.asociado,
    createdAt: item.fechaCreacionContenido,
    canEdit: item.editable !== false,
    canDelete: item.editable !== false,
    resourcesReady: item.listoParaProgramar === true,
    resourceCount: item.cantidadRecursos,
    scheduleState: item.estadoCronograma,
    temporalUnitName: item.nombreUnidadTemporal,
    cronogramaName: item.nombreUnidadPadreCronograma,
    cronogramaStatus: item.estadoCronograma,
  };
}

export function resourcesAreReady(resources, destinationModules) {
  const active = new Set(destinationModules.map((module) => module.id));
  return (
    resources.length > 0 &&
    resources.every((resource) =>
      resource.moduleIds?.some((id) => active.has(id)),
    )
  );
}
