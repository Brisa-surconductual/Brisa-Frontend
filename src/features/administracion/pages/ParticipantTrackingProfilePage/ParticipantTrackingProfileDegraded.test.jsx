import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SectionErrorBoundary } from '../../components/SectionErrorBoundary/index.js';
import { CURRENT_FRESHNESS } from '../../services/dataFreshness.js';
import { FRESHNESS_STATE } from '../../types/dataFreshness.js';
import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { ALERT_HISTORY_STATUS, INDICATOR_STATE } from '../../types/participantTracking.js';
import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

/*
 * Consulta temporal M04 y modo degradado (RF-149) en la ficha. Los cinco
 * hooks se sustituyen por estados fijos; cada uno se prueba aparte.
 */
const hooks = vi.hoisted(() => ({ profile: null, history: null, narrative: null, notifications: null, temporal: null, args: {} }));

vi.mock('./hooks/useParticipantTrackingProfile.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useParticipantTrackingProfile: () => hooks.profile,
}));
vi.mock('./hooks/useAlertHistory.js', () => ({
  useAlertHistory: (args) => {
    hooks.args.history = args;
    return hooks.history;
  },
}));
vi.mock('./hooks/useNarrativeProgress.js', () => ({
  useNarrativeProgress: (args) => {
    hooks.args.narrative = args;
    return hooks.narrative;
  },
}));
vi.mock('./hooks/useNotificationInteraction.js', () => ({
  useNotificationInteraction: (args) => {
    hooks.args.notifications = args;
    return hooks.notifications;
  },
}));
vi.mock('./hooks/useTemporalLocation.js', () => ({
  useTemporalLocation: (args) => {
    hooks.args.temporal = args;
    return hooks.temporal;
  },
}));

const AT = '2026-03-08T14:30:00-05:00';
const STALE = Object.freeze({ state: FRESHNESS_STATE.STALE, lastAvailableAt: AT });
const available = (value) => ({ state: INDICATOR_STATE.AVAILABLE, value });

const PROFILE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: 'X-1',
  profile: { progressLevel: 'INICIAL', completedUnits: 1, adherence: 0.34, daysWithRecord: 8, trend: 'ESTABLE', activeAlerts: [], updatedAt: AT },
  status: PROFILE_STATUS.READY,
  freshness: CURRENT_FRESHNESS,
  isLoading: false,
  isDemo: true,
  headingRef: { current: null },
  retry: vi.fn(),
});

const TEMPORAL = Object.freeze({
  currentUnitName: 'Unidad de prueba 3',
  effectiveElapsedSeconds: 18 * 86400 + 6 * 3600,
  programFinished: false,
  pauses: [
    { status: 'ACTIVA', startsAt: '2026-03-06T05:00:00Z', endsAt: '2026-03-14T04:59:00Z' },
    { status: 'FINALIZADA', startsAt: '2026-02-17T05:00:00Z', endsAt: '2026-02-21T04:59:00Z' },
    { status: 'ANULADA', startsAt: '2026-02-03T05:00:00Z', endsAt: 'sin-fecha' },
    { status: 'SUSPENDIDA', startsAt: null, endsAt: null },
  ],
});

const ready = (key, data, changes = {}) => ({
  [key]: data, status: SECTION_STATUS.READY, freshness: CURRENT_FRESHNESS, isLoading: false, retry: vi.fn(), ...changes,
});

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const SECTIONS = Object.freeze(['historial-alertas', 'progresion-narrativa', 'interaccion-notificaciones', 'ubicacion-temporal']);
const blockOf = (html, id) => {
  const start = html.indexOf(`aria-labelledby="${id}"`);
  if (start < 0) return '';
  const next = SECTIONS.map((other) => html.indexOf(`aria-labelledby="${other}"`, start + 1)).filter((index) => index > start);
  return html.slice(start, next.length ? Math.min(...next) : undefined);
};
const headerBlock = (html) => html.slice(0, html.indexOf('aria-labelledby="historial-alertas"'));

function render({ profile = {}, history = {}, narrative = {}, notifications = {}, temporal = {} } = {}) {
  hooks.profile = { ...PROFILE, ...profile };
  hooks.history = { ...ready('alerts', [{ type: 'INACTIVIDAD', source: 'RF-68', generatedAt: AT, status: 'RESUELTA', resolvedAt: null }]), status: ALERT_HISTORY_STATUS.READY, hasSummaryMismatch: false, ...history };
  hooks.narrative = ready('narrative', { activePhaseName: 'Fase de prueba', lastCompletedChapterName: 'Capítulo de prueba', achievements: [] }, narrative);
  hooks.notifications = ready('interaction', {
    counts: { sent: available(5), delivered: available(5), opened: available(1), dismissed: available(0), sessionsFromNotification: available(1) },
    rates: { openRate: available(0.2), conversionRate: available(0.2), dismissalRate: available(0) },
    hasNotCalculable: false,
  }, notifications);
  hooks.temporal = ready('temporal', TEMPORAL, temporal);
  return clean(renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/c-1/seguimiento/PART-0001']}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:codigoParticipante" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  ));
}

afterEach(() => {
  Object.assign(hooks, { profile: null, history: null, narrative: null, notifications: null, temporal: null, args: {} });
});

describe('Consulta temporal M04 en la ficha', () => {
  it('añade la sección al final, consultada con la cohorte y la referencia de la ruta', () => {
    const html = render();

    expect(html.indexOf('id="interaccion-notificaciones"')).toBeLessThan(html.indexOf('id="ubicacion-temporal"'));
    expect(hooks.args.temporal).toEqual({ cohortId: 'c-1', reference: 'PART-0001', enabled: true });
  });

  it('muestra unidad vigente, tiempo efectivo transcurrido y estado del cronograma', () => {
    const text = textOf(blockOf(render(), 'ubicacion-temporal'));

    expect(text).toMatch(/Unidad temporal vigente Unidad de prueba 3/);
    expect(text).toMatch(/Tiempo efectivo transcurrido 18 días y 6 horas Descontadas las pausas/);
    expect(text).toMatch(/Estado del cronograma En curso/);
  });

  it('pausas con estado (texto e ícono) y fechas en hora de Colombia; sin motivo', () => {
    const block = blockOf(render(), 'ubicacion-temporal');
    const text = textOf(block);

    expect(text).toMatch(/Pausas administrativas \(4\)/);
    expect(block).toContain('<time dateTime="2026-03-06T05:00:00Z">6 de mar de 2026, 00:00</time>');
    for (const label of ['Activa', 'Finalizada', 'Anulada', 'Estado no reconocido']) expect(text).toContain(label);
    expect(text).not.toContain('SUSPENDIDA');
    expect(text).toContain('fecha no disponible');
    expect(text).not.toMatch(/motivo/i);
  });

  it('valores ausentes: «No disponible», sin inventar; cronograma finalizado; pausas vacías', () => {
    const text = textOf(blockOf(render({ temporal: { temporal: { currentUnitName: null, effectiveElapsedSeconds: null, programFinished: null, pauses: null } } }), 'ubicacion-temporal'));
    expect(text).toMatch(/Unidad temporal vigente No disponible/);
    expect(text).toMatch(/Tiempo efectivo transcurrido No disponible/);
    expect(text).toMatch(/Estado del cronograma No disponible/);
    expect(text).toMatch(/Pausas administrativas No disponible/);

    const finished = textOf(blockOf(render({ temporal: { temporal: { ...TEMPORAL, programFinished: true, pauses: [] } } }), 'ubicacion-temporal'));
    expect(finished).toMatch(/Cronograma finalizado/);
    expect(finished).toMatch(/Sin pausas administrativas registradas/);
  });

  it.each([
    [SECTION_STATUS.EMPTY, 'Sin cronograma asignado', false],
    [SECTION_STATUS.DENIED, 'No tiene permisos para consultar la ubicación temporal del participante.', false],
    [SECTION_STATUS.INCONSISTENT, 'La información temporal retornada no corresponde al participante solicitado.', true],
    [SECTION_STATUS.UNAVAILABLE, 'El módulo de cronograma no se encuentra disponible en este momento.', true],
    [SECTION_STATUS.ERROR, 'No fue posible cargar la ubicación temporal del participante.', true],
  ])('M04 %s: aviso propio, sin datos; las demás secciones siguen visibles', (status, message, retry) => {
    const html = render({ temporal: { status, temporal: null } });
    const block = blockOf(html, 'ubicacion-temporal');

    expect(textOf(block)).toContain(message);
    expect(block).not.toMatch(/Unidad de prueba|<dl/);
    expect(block.includes('Reintentar ubicación temporal')).toBe(retry);
    expect(html).toContain('id="indicadores-principales"');
    expect(textOf(blockOf(html, 'progresion-narrativa'))).toContain('Fase de prueba');
  });

  it('solo consulta: sin botones, formularios ni enlaces para cronogramas o pausas', () => {
    const html = render();

    expect(html).not.toMatch(/<form|<input|<select|<textarea/);
    // RF-145: el único botón es la exportación CSV, que solo lee.
    expect((html.match(/<button[\s\S]*?<\/button>/g) ?? []).map((button) => textOf(button).trim()))
      .toEqual(['Exportar CSV del historial de seguimiento']);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(textOf(html)).not.toMatch(/Registrar pausa|Editar|Anular|Asignar|Reprogramar|Finalizar/);
  });
});

describe('Modo degradado (RF-149): advertencia por sección', () => {
  it('con todas las fuentes actuales no hay ninguna advertencia', () => {
    expect(render()).not.toMatch(/Modo degradado|Desactualizado/);
  });

  it.each([
    ['historial', { history: { freshness: STALE } }, 'historial-alertas', 'seguimiento'],
    ['M06', { narrative: { freshness: STALE } }, 'progresion-narrativa', 'gamificación'],
    ['M07', { notifications: { freshness: STALE } }, 'interaccion-notificaciones', 'notificaciones'],
    ['M04', { temporal: { freshness: STALE } }, 'ubicacion-temporal', 'cronograma'],
  ])('%s desactualizado: aviso prominente con fecha exacta y marca en el título, solo en su sección', (_, changes, id, module) => {
    const html = render(changes);
    const block = blockOf(html, id);

    expect(block).toMatch(/<h2[^>]*>[\s\S]*Desactualizado[\s\S]*<\/h2>/);
    expect(block).toMatch(/role="status"[^>]*border-2[\s\S]*Modo degradado: datos desactualizados/);
    expect(textOf(block)).toContain(`Los datos de ${module} no están actualizados en tiempo real`);
    expect(block).toContain(`<time dateTime="${AT}" class="font-bold">8 de mar de 2026, 14:30</time>`);
    expect(html.match(/Modo degradado: datos desactualizados/g)).toHaveLength(1);
  });

  it('la advertencia no tiene botón para cerrarla u ocultarla', () => {
    const block = blockOf(render({ narrative: { freshness: STALE } }), 'progresion-narrativa');

    expect(block).not.toMatch(/<button|Cerrar|Ocultar|Descartar aviso/);
  });

  it('ficha M05 desactualizada: aviso antes de los indicadores y marca en indicadores y alertas activas', () => {
    const header = headerBlock(render({ profile: { freshness: STALE } }));

    expect(header.indexOf('Modo degradado: datos desactualizados')).toBeLessThan(header.indexOf('id="indicadores-principales"'));
    expect(textOf(header)).toContain('Los datos de seguimiento no están actualizados en tiempo real');
    expect(header.match(/Desactualizado/g)).toHaveLength(2);
    expect(header).toContain('Nivel de progreso');
  });

  it('una advertencia de datos desactualizados no se muestra en estados sin datos', () => {
    const html = render({ narrative: { status: SECTION_STATUS.UNAVAILABLE, narrative: null, freshness: STALE } });

    expect(blockOf(html, 'progresion-narrativa')).not.toContain('Modo degradado');
  });

  it.each([
    ['historial', { history: { status: ALERT_HISTORY_STATUS.STALE_UNDATED, alerts: null } }, 'historial-alertas', 'seguimiento'],
    ['M06', { narrative: { status: SECTION_STATUS.STALE_UNDATED, narrative: null } }, 'progresion-narrativa', 'gamificación'],
    ['M07', { notifications: { status: SECTION_STATUS.STALE_UNDATED, interaction: null } }, 'interaccion-notificaciones', 'notificaciones'],
  ])('%s desactualizado sin fecha confiable: no muestra datos y lo explica', (_, changes, id, module) => {
    const block = blockOf(render(changes), id);

    expect(textOf(block)).toContain('Datos desactualizados sin fecha confiable');
    expect(textOf(block)).toContain(`El módulo de ${module} no responde en tiempo real`);
    expect(block).toContain('Reintentar');
    expect(block).not.toMatch(/<dl|<ol/);
  });

  it('ficha M05 sin fecha confiable: sin indicadores, con aviso; las demás secciones se consultan', () => {
    const html = render({ profile: { status: PROFILE_STATUS.STALE_UNDATED, profile: null, code: null } });

    expect(textOf(headerBlock(html))).toContain('Datos desactualizados sin fecha confiable');
    expect(html).not.toContain('id="indicadores-principales"');
    expect(hooks.args.narrative.enabled).toBe(true);
    expect(textOf(blockOf(html, 'progresion-narrativa'))).toContain('Fase de prueba');
  });
});

describe('Independencia de las secciones (RF-149)', () => {
  it.each([
    ['M05 no disponible', { status: PROFILE_STATUS.UNAVAILABLE }],
    ['M05 con error', { status: PROFILE_STATUS.ERROR }],
  ])('%s: la ficha muestra su error y M06, M07, M04 y el historial siguen consultándose', (_, profile) => {
    const html = render({ profile: { ...profile, profile: null, code: null } });

    for (const key of ['history', 'narrative', 'notifications', 'temporal']) expect(hooks.args[key].enabled).toBe(true);
    expect(textOf(headerBlock(html))).toMatch(/Módulo no disponible|Ficha no disponible/);
    expect(textOf(blockOf(html, 'progresion-narrativa'))).toContain('Fase de prueba');
    expect(textOf(blockOf(html, 'interaccion-notificaciones'))).toContain('Enviadas');
    expect(textOf(blockOf(html, 'ubicacion-temporal'))).toContain('Unidad de prueba 3');
  });

  it('M05 no disponible: el aviso indica que no hay datos anteriores y que el resto se consulta aparte', () => {
    const text = textOf(headerBlock(render({ profile: { status: PROFILE_STATUS.UNAVAILABLE, profile: null, code: null } })));

    expect(text).toContain('No hay datos anteriores disponibles para mostrar; las demás secciones se consultan por separado.');
  });

  it('dos fuentes caídas a la vez (M06 sin datos anteriores, M07 desactualizado): cada una con su estado', () => {
    const html = render({ narrative: { status: SECTION_STATUS.UNAVAILABLE, narrative: null }, notifications: { freshness: STALE } });

    expect(textOf(blockOf(html, 'progresion-narrativa'))).toContain('El módulo de gamificación no se encuentra disponible');
    expect(textOf(blockOf(html, 'interaccion-notificaciones'))).toMatch(/Modo degradado[\s\S]*Enviadas/);
    expect(html).toContain('id="indicadores-principales"');
    expect(textOf(blockOf(html, 'ubicacion-temporal'))).toContain('Unidad de prueba 3');
  });

  it('todas las secciones con error: la ficha sigue mostrando sus indicadores', () => {
    const html = render({
      history: { status: ALERT_HISTORY_STATUS.ERROR, alerts: null },
      narrative: { status: SECTION_STATUS.ERROR, narrative: null },
      notifications: { status: SECTION_STATUS.UNAVAILABLE, interaction: null },
      temporal: { status: SECTION_STATUS.UNAVAILABLE, temporal: null },
    });

    expect(html).toContain('id="indicadores-principales"');
    expect(html.match(/role="alert"/g).length).toBeGreaterThanOrEqual(4);
  });

  it('participante sin perfil (204 de RF-128): no autoriza nada por sí mismo; cada sección conserva su propia autorización', () => {
    const html = render({ profile: { status: PROFILE_STATUS.NO_PROFILE, profile: null }, narrative: { status: SECTION_STATUS.DENIED, narrative: null } });

    expect(hooks.args.narrative.enabled).toBe(true);
    expect(textOf(blockOf(html, 'progresion-narrativa'))).toContain('Acceso restringido a la progresión narrativa');
    expect(blockOf(html, 'progresion-narrativa')).not.toContain('Fase de prueba');
    expect(textOf(blockOf(html, 'ubicacion-temporal'))).toContain('Unidad de prueba 3');
  });

  it.each([
    ['denegada', PROFILE_STATUS.DENIED],
    ['inexistente', PROFILE_STATUS.NOT_FOUND],
    ['cohorte inexistente', PROFILE_STATUS.COHORT_NOT_FOUND],
    ['fuera de la cohorte', PROFILE_STATUS.OUTSIDE_COHORT],
    ['inconsistente', PROFILE_STATUS.INCONSISTENT],
  ])('ficha %s: no consulta ninguna sección ni muestra datos protegidos, ni siquiera desactualizados', (_, status) => {
    const html = render({ profile: { status, profile: null, code: null }, narrative: { freshness: STALE } });

    for (const key of ['history', 'narrative', 'notifications', 'temporal']) expect(hooks.args[key].enabled).toBe(false);
    expect(html).not.toMatch(/historial-alertas|progresion-narrativa|interaccion-notificaciones|ubicacion-temporal|Modo degradado|Unidad de prueba|Fase de prueba/);
  });

  it('en la API real: ninguna sección consultada ni advertencia, con aviso de secciones no disponibles', () => {
    const html = render({ profile: { isDemo: false }, narrative: { freshness: STALE } });

    for (const key of ['history', 'narrative', 'notifications', 'temporal']) expect(hooks.args[key].enabled).toBe(false);
    expect(textOf(html)).toContain('Otras secciones aún no disponibles');
    expect(html).not.toMatch(/ubicacion-temporal|Modo degradado/);
  });
});

describe('Límite de error por sección', () => {
  it('sin error presenta la sección tal cual', () => {
    const boundary = new SectionErrorBoundary({ label: 'Progresión narrativa', children: <p>contenido</p> });

    expect(renderToStaticMarkup(boundary.render())).toBe('<p>contenido</p>');
  });

  it('si la sección falla al presentarse, solo ella muestra un aviso, sin detalle técnico', () => {
    const boundary = new SectionErrorBoundary({ label: 'Progresión narrativa', children: <p>contenido</p> });
    boundary.state = SectionErrorBoundary.getDerivedStateFromError(new Error('detalle interno'));
    const html = clean(renderToStaticMarkup(boundary.render()));

    expect(html).toMatch(/role="alert"/);
    expect(textOf(html)).toContain('Progresión narrativa: no se pudo mostrar');
    expect(textOf(html)).toContain('Las demás secciones de la ficha no se ven afectadas.');
    expect(html).not.toMatch(/contenido|detalle interno/);
  });
});

describe('Privacidad', () => {
  it('no muestra datos personales, identificadores, motivos de pausa ni contenido clínico', () => {
    expect(render({ narrative: { freshness: STALE } })).not.toMatch(/@|uuid|demo-participante|seg-|motivo|diario|chat/i);
  });
});
