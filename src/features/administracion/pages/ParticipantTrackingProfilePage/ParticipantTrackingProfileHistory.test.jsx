import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AlertHistoryList } from '../../components/AlertHistoryList/index.js';
import { AlertResolutionBadge } from '../../components/AlertResolutionBadge/index.js';
import { ALERT_HISTORY_STATUS } from '../../types/participantTracking.js';
import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

/*
 * Historial de alertas (RF-129) dentro de la ficha (RF-128). Ambos hooks
 * se sustituyen por estados fijos; el comportamiento de cada hook se
 * prueba por separado.
 */
const hooks = vi.hoisted(() => ({ profile: null, history: null, historyArgs: null }));

vi.mock('./hooks/useParticipantTrackingProfile.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useParticipantTrackingProfile: () => hooks.profile,
}));

vi.mock('./hooks/useAlertHistory.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useAlertHistory: (args) => {
    hooks.historyArgs = args;
    return hooks.history;
  },
}));

const ACTIVE = Object.freeze([
  { type: 'CRAVING_ELEVADO', generatedAt: '2026-03-07T21:15:00-05:00' },
]);

const HISTORY = Object.freeze([
  { type: 'CRAVING_ELEVADO', source: 'RF-63', generatedAt: '2026-02-10T21:00:00-05:00', status: 'RESUELTA', resolvedAt: null },
  { type: 'CRAVING_ELEVADO', source: 'RF-63', generatedAt: '2026-02-18T23:05:00-05:00', status: 'DESCARTADA', resolvedAt: '2026-02-19T09:10:00-05:00' },
  { type: 'INACTIVIDAD', source: 'RF-68', generatedAt: '2026-02-24T07:30:00-05:00', status: 'RESUELTA', resolvedAt: '2026-02-25T16:20:00-05:00' },
  { type: 'CRAVING_ELEVADO', source: 'RF-63', generatedAt: '2026-03-03T22:40:00-05:00', status: 'EN_REVISION', resolvedAt: null },
  { type: 'CRAVING_ELEVADO', source: 'RF-63', generatedAt: '2026-03-07T21:15:00-05:00', status: 'ACTIVA', resolvedAt: null },
]);

const PROFILE = Object.freeze({
  progressLevel: 'INICIAL',
  completedUnits: 1,
  adherence: 0.34,
  daysWithRecord: 8,
  trend: 'NO_CALCULADA',
  activeAlerts: ACTIVE,
  updatedAt: '2026-03-09T06:00:00-05:00',
});

const PROFILE_STATE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: 'X-1',
  profile: PROFILE,
  status: PROFILE_STATUS.READY,
  isLoading: false,
  isDemo: true,
  headingRef: { current: null },
  retry: vi.fn(),
});

const HISTORY_STATE = Object.freeze({
  alerts: HISTORY,
  status: ALERT_HISTORY_STATUS.READY,
  isLoading: false,
  hasSummaryMismatch: false,
  retry: vi.fn(),
});

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sectionOf = (html) => html.slice(html.indexOf('aria-labelledby="historial-alertas"'));

function render(profile = {}, history = {}) {
  hooks.profile = { ...PROFILE_STATE, ...profile };
  hooks.history = { ...HISTORY_STATE, ...history };
  return clean(renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/c-1/seguimiento/PART-0001']}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:codigoParticipante" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  ));
}

afterEach(() => {
  hooks.profile = null;
  hooks.history = null;
  hooks.historyArgs = null;
});

describe('Integración con la ficha (RF-128)', () => {
  it('añade la sección después de las alertas activas, con su propio encabezado', () => {
    const html = render();

    expect(html.indexOf('id="alertas-activas"')).toBeLessThan(html.indexOf('id="historial-alertas"'));
    expect(html).toMatch(/<h2 id="historial-alertas"[^>]*>.*Historial de alertas.*\(5\)/);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('consulta el historial de la misma cohorte y referencia, con el resumen para compararlo', () => {
    render();

    expect(hooks.historyArgs).toEqual({ cohortId: 'c-1', reference: 'PART-0001', enabled: true, activeAlerts: ACTIVE });
  });

  it('diferencia el resumen de activas del historial: este incluye resueltas, descartadas y en revisión', () => {
    const html = render();
    const summary = html.slice(html.indexOf('id="alertas-activas"'), html.indexOf('aria-labelledby="historial-alertas"'));

    expect(summary.match(/<li\b/g)).toHaveLength(1);
    expect(textOf(sectionOf(html))).toMatch(/Solo las que figuran como «Activa» forman parte del resumen de alertas activas/);
    expect(sectionOf(html).match(/<li\b/g)).toHaveLength(5);
  });

  it('respeta el orden cronológico recibido', () => {
    const times = [...sectionOf(render()).matchAll(/<time dateTime="([^"]+)"/g)].map(([, value]) => value);

    expect(times.filter((value) => HISTORY.some(({ generatedAt }) => generatedAt === value))).toEqual(HISTORY.map(({ generatedAt }) => generatedAt));
  });

  it('participante sin perfil (204 de RF-128): la ficha confirmó el acceso y muestra su historial', () => {
    const html = render({ status: PROFILE_STATUS.NO_PROFILE, profile: null });

    expect(hooks.historyArgs).toMatchObject({ enabled: true, activeAlerts: null });
    expect(html).toContain('id="historial-alertas"');
  });

  it.each([
    ['cargando', { isLoading: true, status: null, profile: null, code: null }],
    ['denegada', { status: PROFILE_STATUS.DENIED, profile: null, code: null }],
    ['inexistente', { status: PROFILE_STATUS.NOT_FOUND, profile: null, code: null }],
    ['fuera de la cohorte', { status: PROFILE_STATUS.OUTSIDE_COHORT, profile: null, code: null }],
    ['inconsistente', { status: PROFILE_STATUS.INCONSISTENT, profile: null, code: null }],
    ['en la API real (secciones aún no integradas)', { isDemo: false }],
  ])('ficha %s: no consulta el historial ni deja ningún registro visible', (_, profile) => {
    const html = render(profile);

    expect(hooks.historyArgs.enabled).toBe(false);
    expect(html).not.toMatch(/historial-alertas|Historial de alertas|En revisión|Descartada|RF-63/);
  });
});

describe('Estados de la sección', () => {
  it('cargando: aviso accesible sin registros, y los indicadores siguen visibles', () => {
    const html = render({}, { isLoading: true, status: null, alerts: null });

    expect(sectionOf(html)).toMatch(/aria-busy="true"[\s\S]*role="status"[^>]*>Cargando el historial de alertas/);
    expect(sectionOf(html)).not.toMatch(/<li\b/);
    expect(html).toContain('id="indicadores-principales"');
  });

  it('sin alertas registradas (204): aviso propio, sin lista', () => {
    const section = sectionOf(render({}, { status: ALERT_HISTORY_STATUS.EMPTY, alerts: null }));

    expect(section).toMatch(/role="status"[\s\S]*El participante no cuenta con alertas registradas\./);
    expect(section).not.toMatch(/<ol|Reintentar/);
  });

  it.each([
    [ALERT_HISTORY_STATUS.DENIED, 'No tiene permisos para consultar el historial de alertas del participante.', false],
    [ALERT_HISTORY_STATUS.NOT_FOUND, 'El participante seleccionado no existe.', false],
    [ALERT_HISTORY_STATUS.COHORT_NOT_FOUND, 'La cohorte solicitada no existe en el sistema.', false],
    [ALERT_HISTORY_STATUS.OUTSIDE_COHORT, 'El participante ya no pertenece a esta cohorte.', false],
    [ALERT_HISTORY_STATUS.INCONSISTENT, 'El historial de alertas contiene información no asociada al participante solicitado.', true],
    [ALERT_HISTORY_STATUS.UNAVAILABLE, 'El módulo de seguimiento no se encuentra disponible en este momento.', true],
    [ALERT_HISTORY_STATUS.ERROR, 'No fue posible cargar el historial de alertas del participante.', true],
  ])('%s: alerta propia de la sección, sin registros, sin ocultar la ficha', (status, message, retry) => {
    const html = render({}, { status, alerts: null });
    const section = sectionOf(html);

    expect(section).toMatch(/role="alert"/);
    expect(textOf(section)).toContain(message);
    expect(section).not.toMatch(/<ol|RF-63|En revisión/);
    expect(section.includes('Reintentar historial')).toBe(retry);
    expect(html).toContain('id="indicadores-principales"');
    expect(html).toContain('X-1');
  });

  it('historial denegado en demostración: aclara que es simulado', () => {
    expect(textOf(sectionOf(render({}, { status: ALERT_HISTORY_STATUS.DENIED, alerts: null })))).toContain('Resultado simulado por la fuente de demostración');
  });

  it('si el resumen y el historial difieren lo indica, sin corregir ninguno', () => {
    const html = render({}, { hasSummaryMismatch: true });

    expect(textOf(sectionOf(html))).toContain('El resumen y el historial no coinciden');
    expect(sectionOf(html).match(/<li\b/g)).toHaveLength(5);
    expect(html.slice(html.indexOf('id="alertas-activas"'), html.indexOf('aria-labelledby="historial-alertas"')).match(/<li\b/g)).toHaveLength(1);
  });

  it('solo consulta: sin botones, formularios ni enlaces nuevos; sin acciones sobre las alertas', () => {
    const html = render();

    expect(html).not.toMatch(/<form|<input|<select|<textarea/);
    // RF-145: el único botón es la exportación CSV, que solo lee.
    expect((html.match(/<button[\s\S]*?<\/button>/g) ?? []).map((button) => textOf(button).trim()))
      .toEqual(['Exportar CSV del historial de seguimiento']);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(textOf(html)).not.toMatch(/Marcar como atendida|Atender|Resolver|Descartar\b|Eliminar|Editar|Reabrir/);
  });

  it('no muestra datos personales, identificadores internos ni otros datos clínicos', () => {
    expect(render()).not.toMatch(/@|uuid|alertId|demo-participante|seg-|diario|chat|craving \d|nivel(?! de progreso)/i);
  });
});

describe('Registros del historial', () => {
  const list = (alerts) => clean(renderToStaticMarkup(<AlertHistoryList alerts={alerts} />));
  const alert = (changes) => ({ type: 'INACTIVIDAD', source: 'RF-68', generatedAt: '2026-02-24T07:30:00-05:00', status: 'RESUELTA', resolvedAt: null, ...changes });

  it('lista ordenada con tipo, estado, fecha de generación y fuente', () => {
    const html = list([alert({ type: 'CRAVING_ELEVADO', source: 'RF-63', status: 'ACTIVA' }), alert({})]);

    expect(html).toMatch(/^<ol/);
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(html.match(/<h3/g)).toHaveLength(2);
    expect(textOf(html)).toMatch(/Craving elevado .*Activa .*Generada: 24 de feb de 2026, 07:30 .*Fuente: Detección de craving elevado/);
    expect(textOf(html)).toMatch(/Inactividad .*Resuelta .*Fuente: Detección de inactividad/);
    // El identificador del requerimiento no se presenta en lugar de la descripción.
    expect(textOf(html)).not.toMatch(/RF-\d+/);
  });

  it('la presentación no altera la fuente original de los datos', () => {
    const alerts = [alert({ source: 'RF-63' }), alert({})];

    list(alerts);

    expect(alerts.map(({ source }) => source)).toEqual(['RF-63', 'RF-68']);
  });

  it('fechas de generación y resolución en hora de Colombia', () => {
    const html = list([alert({ generatedAt: '2026-02-19T02:15:00Z', resolvedAt: '2026-02-25T21:20:00Z' })]);

    expect(html).toContain('<time dateTime="2026-02-19T02:15:00Z">18 de feb de 2026, 21:15</time>');
    expect(textOf(html)).toContain('Resolución: 25 de feb de 2026, 16:20');
  });

  it('fechas ausentes o inválidas: nunca se inventan', () => {
    expect(textOf(list([alert({ resolvedAt: null })]))).toContain('Resolución: No registrada');
    expect(textOf(list([alert({ status: 'DESCARTADA', resolvedAt: null })]))).toContain('Resolución: No registrada');
    expect(textOf(list([alert({ resolvedAt: 'fecha-invalida' })]))).toContain('Resolución: No disponible');
    expect(textOf(list([alert({ generatedAt: '2025-11-15 08:00' })]))).toContain('Generada: No disponible');
    expect(textOf(list([alert({ generatedAt: null })]))).toContain('Generada: No disponible');
    expect(list([alert({ status: 'ACTIVA' })])).not.toContain('Resolución');
    expect(list([alert({ status: 'EN_REVISION' })])).not.toContain('Resolución');
  });

  it('tipo, estado y fuente desconocidos se indican sin mostrar el valor técnico', () => {
    const text = textOf(list([alert({ type: 'RECAIDA', source: 'RF-99', status: 'ARCHIVADA' })]));

    expect(text).toContain('Tipo no reconocido');
    expect(text).toContain('Fuente: Fuente no reconocida');
    expect(text).not.toContain('RF-99');
    expect(text).toContain('Estado no reconocido');
    expect(text).not.toMatch(/RECAIDA|ARCHIVADA/);
    expect(textOf(list([alert({ type: null, source: null, status: null })]))).toMatch(/Tipo no disponible.*Estado no disponible.*Fuente no disponible/);
  });

  it.each([
    ['ACTIVA', 'Activa', 'warning'],
    ['EN_REVISION', 'En revisión', 'info'],
    ['RESUELTA', 'Resuelta', 'success'],
    ['DESCARTADA', 'Descartada', 'surface-hover'],
    ['ARCHIVADA', 'Estado no reconocido', 'surface-hover'],
  ])('estado %s: «%s» con texto e ícono, no solo color', (status, label, tone) => {
    const html = clean(renderToStaticMarkup(<AlertResolutionBadge status={status} />));

    expect(textOf(html).trim()).toBe(`Estado de resolución: ${label}`);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain(`var(--${tone}`);
  });
});
