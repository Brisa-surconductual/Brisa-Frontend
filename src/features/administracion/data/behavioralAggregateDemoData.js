/*
 * DATOS FICTICIOS de la vista agregada conductual (RF-132), solo para el
 * modo de demostración y las pruebas. No provienen de M05 ni del backend.
 *
 * Campos oficiales de `datos` (RF-78 / RF-132): total_usuarios_activos,
 * distribucion_niveles_progreso, tasa_adherencia_promedio,
 * alertas_inactividad_pendientes, alertas_craving_pendientes y
 * fecha_actualizacion.
 *
 * NO oficial: RF-78 define la distribución como «niveles de progreso y
 * cantidad de usuarios asociados a cada nivel», sin nombrar los campos de
 * cada elemento. `nivel` y `total_usuarios` son nombres provisionales de
 * esta demostración y deben confirmarse con el backend.
 *
 * Cada cohorte ficticia tiene valores distintos, para comprobar que al
 * cambiar de cohorte no se ven los de otra. Los valores son arbitrarios:
 * no se calculan a partir de los participantes ficticios del M08.
 */
export const DEMO_AGGREGATE_TIMESTAMP = '2026-11-20T13:00:00Z';

const level = (nivel, totalUsuarios) =>
  Object.freeze({ nivel, total_usuarios: totalUsuarios });

export const DEMO_AGGREGATE_DATA = Object.freeze({
  'demo-cohorte-a': Object.freeze({
    total_usuarios_activos: 0,
    distribucion_niveles_progreso: Object.freeze([
      level('INICIAL', 0),
      level('EN_AVANCE', 0),
      level('AVANZADO', 0),
      level('COMPLETADO', 0),
    ]),
    tasa_adherencia_promedio: 0,
    alertas_inactividad_pendientes: 0,
    alertas_craving_pendientes: 0,
    fecha_actualizacion: '2026-11-19T22:15:00Z',
  }),
  'demo-cohorte-b': Object.freeze({
    total_usuarios_activos: 18,
    distribucion_niveles_progreso: Object.freeze([
      level('INICIAL', 3),
      level('EN_AVANCE', 9),
      level('AVANZADO', 4),
      level('COMPLETADO', 2),
    ]),
    tasa_adherencia_promedio: 0.7342,
    alertas_inactividad_pendientes: 2,
    alertas_craving_pendientes: 1,
    fecha_actualizacion: DEMO_AGGREGATE_TIMESTAMP,
  }),
  'demo-cohorte-c': Object.freeze({
    total_usuarios_activos: 11,
    distribucion_niveles_progreso: Object.freeze([
      level('INICIAL', 1),
      level('EN_AVANCE', 2),
      level('AVANZADO', 3),
      level('COMPLETADO', 5),
    ]),
    tasa_adherencia_promedio: 0.6125,
    alertas_inactividad_pendientes: 0,
    alertas_craving_pendientes: 3,
    fecha_actualizacion: '2026-11-18T16:40:00Z',
  }),
});

/*
 * Campos individuales que la fuente ficticia añade a propósito: la
 * interfaz debe descartarlos (RF-132 prohíbe identificar participantes).
 * Valores ficticios reconocibles (PART-NNNN, example.com).
 */
export const DEMO_FORBIDDEN_FIELDS = Object.freeze({
  participantes: Object.freeze([
    Object.freeze({
      id_usuario: '00000000-0000-4000-8000-0000000000aa',
      codigo: 'PART-0099',
      nombre: 'Participante ficticio',
      correo: 'ficticio@example.com',
      nivel_progreso: 'INICIAL',
    }),
  ]),
});
