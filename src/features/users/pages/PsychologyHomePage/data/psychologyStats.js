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
    unit: 'cuentas activas',
    tone: 'brand',
  }),

  Object.freeze({
    id: 'COMPLETO',
    key: 'conRegistroCompleto',
    label: 'Con registro completo',
    unit: 'estudiantes',
    tone: 'success',
  }),

  Object.freeze({
    id: 'PENDIENTE',
    key: 'conRegistroPendiente',
    label: 'Con registro pendiente',
    unit: 'estudiantes',
    tone: 'warning',
  }),

  Object.freeze({
    id: 'DURACION_BASE',
    key: 'diasCronogramaBase',
    label: 'Duración del cronograma base',
    unit: 'días',
    tone: 'info',
  }),
]);

/*
 * Accesos del dashboard: solo rutas existentes. No se enlaza
 * Población porque aún muestra datos de ejemplo. El chat se
 * identifica como pendiente de integración: su pantalla todavía
 * no recibe datos del backend.
 */
export const DASHBOARD_SHORTCUTS = Object.freeze([
  Object.freeze({
    id: 'CRONOGRAMAS',
    title: 'Gestionar cronogramas',
    description: 'Crea, revisa y activa cronogramas y sus unidades.',
    to: '/app/administrativo/cronograma',
  }),
  Object.freeze({
    id: 'PROGRESO',
    title: 'Progreso de participantes',
    description: 'Consulta la ubicación temporal de cada participante.',
    to: '/app/administrativo/cronograma/progreso',
  }),
  Object.freeze({
    id: 'CONTENIDOS',
    title: 'Contenidos psicoeducativos',
    description: 'Administra contenidos y sus recursos.',
    to: '/app/administrativo/cronograma/contenidos',
  }),
  Object.freeze({
    id: 'CHAT',
    title: 'Modalidad del chat',
    description: 'Configuración de la modalidad del programa.',
    to: '/app/administrativo/chat/modalidad',
    status: 'Integración pendiente',
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
