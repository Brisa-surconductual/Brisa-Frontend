/*
 * Aviso de una sección degradada sin fecha confiable del último dato
 * (RF-149): los datos no se muestran porque no puede indicarse su
 * antigüedad exacta.
 */
export const staleUndatedMessage = (moduleLabel) => Object.freeze({
  title: 'Datos desactualizados sin fecha confiable',
  message: `El módulo de ${moduleLabel} no responde en tiempo real y la fecha del último dato disponible no es confiable. Por seguridad no se muestran datos desactualizados.`,
});
