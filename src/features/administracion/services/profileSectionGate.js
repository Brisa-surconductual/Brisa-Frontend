/*
 * Cuándo puede la ficha consultar sus secciones dependientes (RF-129
 * historial, RF-130 M06, RF-131 M07 y la consulta temporal de M04).
 *
 * Cada sección tiene su propia autorización explícita y su propio
 * aislamiento; esta regla solo decide si la ficha (RF-128) ha dicho algo
 * que IMPIDA seguir consultando:
 *
 * - Se consulta si la ficha confirmó el acceso (perfil o sin perfil; el
 *   «sin perfil» no autoriza nada por sí mismo: cada sección sigue
 *   exigiendo su propia autorización).
 * - Se consulta también si M05 falló por indisponibilidad o error
 *   (RF-149: la caída de un módulo fuente no debe bloquear a los demás),
 *   incluido el degradado sin fecha confiable.
 * - NO se consulta si la ficha está cargando, denegada, el participante
 *   o la cohorte no existen, el participante está fuera de la cohorte o
 *   la respuesta fue inconsistente: son decisiones de acceso o de
 *   identidad, y consultar otros módulos podría exponer datos ajenos.
 *
 * Los valores de estado son los de PROFILE_STATUS.
 */
const ALLOWED = Object.freeze(['READY', 'NO_PROFILE', 'UNAVAILABLE', 'ERROR', 'STALE_UNDATED']);

export function allowsDependentSections({ status, isLoading }) {
  return !isLoading && ALLOWED.includes(status);
}
