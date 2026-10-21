/*
 * Definiciones de tarjetas del dashboard. Los valores llegan del backend.
 * Los catálogos de Población conservan sus datos de ejemplo independientes.
 *
 * REGLA DE ROL: el perfil administrativo solo accede a
 * información AGREGADA, ANÓNIMA y ESTADÍSTICA. Ningún
 * dato aquí puede referirse a un estudiante concreto,
 * ni siquiera seudonimizado.
 */

export const PROGRAM_STATS = Object.freeze([
  Object.freeze({
    id: 'ACTIVOS',
    key: 'estudiantesActivos',
    label: 'Estudiantes activos',
    tone: 'brand',
  }),

  Object.freeze({
    id: 'COMPLETO',
    key: 'conRegistroCompleto',
    label: 'Con registro completo',
    tone: 'success',
  }),

  Object.freeze({
    id: 'PENDIENTE',
    key: 'conRegistroPendiente',
    label: 'Con registro pendiente',
    tone: 'warning',
  }),

  Object.freeze({
    id: 'DURACION_BASE',
    key: 'diasCronogramaBase',
    label: 'Días del cronograma base',
    tone: 'info',
  }),
]);

export const FACULTY_DISTRIBUTION = Object.freeze([
  Object.freeze({ id: 'SALUD', label: 'Ciencias de la Salud', count: 48 }),
  Object.freeze({ id: 'INGENIERIAS', label: 'Ingenierías', count: 39 }),
  Object.freeze({ id: 'SOCIALES', label: 'Ciencias Sociales', count: 31 }),
  Object.freeze({ id: 'OTRAS', label: 'Otras facultades', count: 24 }),
]);

export const POPULATION_AVERAGES = Object.freeze([
  Object.freeze({ id: 'SEMESTRE', label: 'Semestre promedio', value: '5,2' }),
  Object.freeze({ id: 'EDAD', label: 'Edad promedio', value: '21,4 años' }),
  Object.freeze({
    id: 'ADHERENCIA',
    label: 'Adherencia semanal promedio',
    value: '68 %',
  }),
]);
