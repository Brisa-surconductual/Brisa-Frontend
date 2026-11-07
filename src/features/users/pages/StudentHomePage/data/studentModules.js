export const STUDENT_MODULE = Object.freeze({
  CHAT: 'CHAT',
  DIARIO: 'DIARIO',
  PROGRESO: 'PROGRESO',
  MASCOTA: 'MASCOTA',
});

/*
 * Catálogo de módulos del programa. Los que traen `to` ya tienen
 * pantalla de entrada y se muestran como enlace; el resto aún no
 * está construido: `release` indica el módulo del proyecto que
 * lo habilitará.
 */
export const STUDENT_MODULES = Object.freeze([
  Object.freeze({
    id: STUDENT_MODULE.CHAT,
    name: 'Chat',
    description: 'Actividades psicoeducativas',
    release: 'M03',
    to: '/app/estudiante/chat',
  }),

  Object.freeze({
    id: STUDENT_MODULE.DIARIO,
    name: 'Diario',
    description: 'Registro libre de situaciones',
    release: 'M02',
  }),

  Object.freeze({
    id: STUDENT_MODULE.PROGRESO,
    name: 'Progreso',
    description: 'Rachas y metas cumplidas',
    release: 'M05',
  }),

  Object.freeze({
    id: STUDENT_MODULE.MASCOTA,
    name: 'Mascota',
    description: 'Gamificación y storytelling',
    release: 'M06',
  }),
]);
