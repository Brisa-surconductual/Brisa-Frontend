/*
 * DATOS FICTICIOS de la vista narrativa agregada (RF-133), solo para el
 * modo de demostración y las pruebas. No provienen de M06 ni del backend.
 *
 * Siguen el contrato de referencia de la Etapa 2
 * (GET /admin/cohortes/{id_cohorte}/vistas/narrativa, que el frontend no
 * consulta): `datos` con distribucion_por_fase_narrativa [{ fase, total }],
 * total_usuarios_programa_completado, total_usuarios_con_logros y
 * total_logros_desbloqueados. La fecha viaja en la envoltura
 * (`ultimo_timestamp_disponible`), como en ese contrato.
 *
 * DIFERENCIA con la especificación: RF-133 y RF-117 también definen
 * `total_usuarios_cohorte` (y RF-117, `fecha_actualizacion`), que el
 * contrato de referencia no incluye. Estos datos tampoco los incluyen:
 * no se inventa su valor. La interfaz los mostraría si llegaran.
 *
 * Cada cohorte ficticia tiene valores distintos, para comprobar que al
 * cambiar de cohorte no se ven los de otra. Los valores son arbitrarios
 * y agregados: no hay perfiles narrativos individuales ni se calculan a
 * partir de los participantes ficticios del M08. La Cohorte Piloto A no
 * tiene métricas narrativas (null).
 */
const phase = (fase, total) => Object.freeze({ fase, total });

export const DEMO_NARRATIVE_DATA = Object.freeze({
  'demo-cohorte-a': null,
  // Piloto B: las fases suman 18, los mismos usuarios activos que la
  // vista conductual (RF-132). Por RF-133, quien aún no tiene avance
  // narrativo cuenta en INICIO. Los 4 asignados restantes (3 pendientes
  // de validación y 1 inactivo) no tienen perfil narrativo activo: es lo
  // que describe el escenario usuarios-excluidos.
  'demo-cohorte-b': Object.freeze({
    distribucion_por_fase_narrativa: Object.freeze([
      phase('INICIO', 6),
      phase('DESARROLLO', 9),
      phase('CIERRE', 3),
    ]),
    total_usuarios_programa_completado: 2,
    total_usuarios_con_logros: 13,
    total_logros_desbloqueados: 41,
  }),
  'demo-cohorte-c': Object.freeze({
    distribucion_por_fase_narrativa: Object.freeze([
      phase('INICIO', 1),
      phase('DESARROLLO', 4),
      phase('CIERRE', 6),
    ]),
    total_usuarios_programa_completado: 5,
    total_usuarios_con_logros: 10,
    total_logros_desbloqueados: 58,
  }),
});

// Fecha de la última agregación diferida de cada cohorte ficticia.
export const DEMO_NARRATIVE_TIMESTAMP = Object.freeze({
  'demo-cohorte-a': '2026-11-19T21:00:00Z',
  'demo-cohorte-b': '2026-11-20T11:30:00Z',
  'demo-cohorte-c': '2026-11-18T15:10:00Z',
});

/*
 * Datos individuales que la fuente ficticia añade a propósito: la
 * interfaz debe descartarlos (RF-133 prohíbe exponer el capítulo activo,
 * los logros específicos o cualquier dato narrativo individual). Valores
 * ficticios reconocibles (PART-NNNN, example.com).
 */
export const DEMO_NARRATIVE_FORBIDDEN_FIELDS = Object.freeze({
  perfiles_narrativos: Object.freeze([
    Object.freeze({
      id_usuario: '00000000-0000-4000-8000-0000000000bb',
      codigo: 'PART-0098',
      nombre: 'Participante narrativo ficticio',
      correo: 'narrativa.ficticia@example.com',
      fase_activa: 'DESARROLLO',
      capitulo_activo: 'Capítulo ficticio 7',
      logros: Object.freeze(['Logro ficticio individual']),
    }),
  ]),
});
