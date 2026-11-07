/*
 * Modo de demostración del M08 (solo desarrollo).
 *
 * Los datos ficticios se usan únicamente si se cumplen las dos
 * condiciones: servidor de desarrollo de Vite (`import.meta.env.DEV`)
 * y la variable local VITE_M08_DEMO=true. En el build de producción
 * DEV es false y el modo nunca se activa.
 *
 * Para habilitarlo, en un .env.local (no versionado) o al lanzar
 * `npm run dev`:
 *   VITE_M08_DEMO=true
 *   VITE_M08_DEMO_SCENARIO=lista | vacio | carga | error
 *                          | sin-cronogramas | error-guardado
 *                          | activacion-bloqueada | carga-participantes
 *                          | error-participantes | error-catalogo
 *                          | conflictos-asignacion  (opcional)
 *
 * - vacio: no hay cohortes; carga: las consultas no terminan;
 * - error: las consultas fallan; error-guardado: guardar falla;
 * - sin-cronogramas: ningún cronograma está activo;
 * - activacion-bloqueada: activar una cohorte inicial se rechaza;
 * - carga-participantes / error-participantes: solo la consulta de
 *   participantes no termina o falla;
 * - error-catalogo: falla la consulta de participantes disponibles;
 * - conflictos-asignacion: los conflictos aparecen al asignar.
 */
export function isCohortDemoEnabled(env = import.meta.env) {
  return Boolean(env.DEV) && env.VITE_M08_DEMO === 'true';
}
