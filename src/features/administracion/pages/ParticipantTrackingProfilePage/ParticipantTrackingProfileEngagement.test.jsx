import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { ALERT_HISTORY_STATUS, INDICATOR_STATE } from '../../types/participantTracking.js';
import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

/*
 * Progresión narrativa (RF-130) e interacción con notificaciones
 * (RF-131) dentro de la ficha. Los cuatro hooks se sustituyen por
 * estados fijos; cada hook se prueba por separado.
 */
const hooks = vi.hoisted(() => ({ profile: null, history: null, narrative: null, notifications: null, args: {} }));

vi.mock('./hooks/useParticipantTrackingProfile.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useParticipantTrackingProfile: () => hooks.profile,
}));
vi.mock('./hooks/useAlertHistory.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useAlertHistory: () => hooks.history,
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

const available = (value) => ({ state: INDICATOR_STATE.AVAILABLE, value });
const NOT_AVAILABLE = { state: INDICATOR_STATE.NOT_AVAILABLE, value: null };
const CALC = { state: INDICATOR_STATE.NOT_CALCULABLE, value: null };

const PROFILE_STATE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: 'X-1',
  profile: {
    progress: available(21),
    adherence: available(34),
    trend: 'ESTABLE',
    activeAlerts: [],
    updatedAt: '2026-03-09T06:00:00-05:00',
  },
  status: PROFILE_STATUS.READY,
  isLoading: false,
  isDemo: true,
  isIntegrationPending: false,
  headingRef: { current: null },
  retry: vi.fn(),
});

const HISTORY_STATE = Object.freeze({
  alerts: [{ type: 'INACTIVIDAD', source: 'RF-68', generatedAt: '2026-02-24T07:30:00-05:00', status: 'RESUELTA', resolvedAt: null }],
  status: ALERT_HISTORY_STATUS.READY,
  isLoading: false,
  hasSummaryMismatch: false,
  retry: vi.fn(),
});

const NARRATIVE = Object.freeze({
  activePhaseName: 'Fase de prueba 2',
  lastCompletedChapterName: 'Capítulo de prueba 2.3',
  achievements: [
    { name: 'Logro de prueba A', unlockedAt: '2026-03-01T23:20:00Z' },
    { name: null, unlockedAt: null },
  ],
});

const INTERACTION = Object.freeze({
  counts: {
    sent: available(35), delivered: available(33), opened: available(0), dismissed: NOT_AVAILABLE, sessionsFromNotification: CALC,
  },
  rates: { openRate: available(0.4242), conversionRate: CALC, dismissalRate: available(0) },
  hasNotCalculable: true,
});

const section = (data, key, changes = {}) => ({ [key]: data, status: SECTION_STATUS.READY, isLoading: false, retry: vi.fn(), ...changes });

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const between = (html, from, to) => {
  const start = html.indexOf(from);
  const end = to ? html.indexOf(to, start) : -1;
  return start < 0 ? '' : html.slice(start, end < 0 ? undefined : end);
};
const narrativeOf = (html) => between(html, 'aria-labelledby="progresion-narrativa"', 'aria-labelledby="interaccion-notificaciones"');
const notificationsOf = (html) => between(html, 'aria-labelledby="interaccion-notificaciones"');

function render({ profile = {}, history = {}, narrative = {}, notifications = {} } = {}) {
  hooks.profile = { ...PROFILE_STATE, ...profile };
  hooks.history = { ...HISTORY_STATE, ...history };
  hooks.narrative = section(NARRATIVE, 'narrative', narrative);
  hooks.notifications = section(INTERACTION, 'interaction', notifications);
  return clean(renderToStaticMarkup(
    <MemoryRouter initialEntries={['/app/administrativo/cohortes/c-1/seguimiento/ref-1']}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:referencia" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  ));
}

afterEach(() => {
  hooks.profile = null;
  hooks.history = null;
  hooks.narrative = null;
  hooks.notifications = null;
  hooks.args = {};
});

describe('Integración con la ficha', () => {
  it('añade ambas secciones después del historial, conservando las de RF-128 y RF-129', () => {
    const html = render();
    const order = ['id="indicadores-principales"', 'id="alertas-activas"', 'id="historial-alertas"', 'id="progresion-narrativa"', 'id="interaccion-notificaciones"'];

    const positions = order.map((marker) => html.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('cada sección consulta con la cohorte y la referencia de la ruta, solo con la ficha confirmada', () => {
    render();

    expect(hooks.args.narrative).toEqual({ cohortId: 'c-1', reference: 'ref-1', enabled: true });
    expect(hooks.args.notifications).toEqual({ cohortId: 'c-1', reference: 'ref-1', enabled: true });
  });

  it('participante sin perfil (204 de RF-128): la ficha confirmó el acceso y ambas secciones se consultan', () => {
    const html = render({ profile: { status: PROFILE_STATUS.NO_PROFILE, profile: null } });

    expect(hooks.args.narrative.enabled).toBe(true);
    expect(html).toContain('id="progresion-narrativa"');
    expect(html).toContain('id="interaccion-notificaciones"');
  });

  it.each([
    ['cargando', { isLoading: true, status: null, profile: null, code: null }],
    ['denegada', { status: PROFILE_STATUS.DENIED, profile: null, code: null }],
    ['inexistente', { status: PROFILE_STATUS.NOT_FOUND, profile: null, code: null }],
    ['inconsistente', { status: PROFILE_STATUS.INCONSISTENT, profile: null, code: null }],
    ['fuera de la cohorte', { status: PROFILE_STATUS.OUTSIDE_COHORT, profile: null, code: null }],
    ['con error', { status: PROFILE_STATUS.ERROR, profile: null, code: null }],
    ['integración pendiente', { isIntegrationPending: true, isDemo: false, status: null, profile: null, code: null }],
  ])('ficha %s: no consulta M06 ni M07 ni muestra ningún dato protegido', (_, profile) => {
    const html = render({ profile });

    expect(hooks.args.narrative.enabled).toBe(false);
    expect(hooks.args.notifications.enabled).toBe(false);
    expect(html).not.toMatch(/progresion-narrativa|interaccion-notificaciones|Fase de prueba|Logro de prueba|Enviadas|Tasa de apertura/);
  });
});

describe('Progresión narrativa (RF-130)', () => {
  it('muestra fase activa, último capítulo y logros con su fecha en hora de Colombia', () => {
    const block = narrativeOf(render());
    const text = textOf(block);

    expect(text).toMatch(/Fase narrativa activa Fase de prueba 2/);
    expect(text).toMatch(/Último capítulo completado Capítulo de prueba 2\.3/);
    expect(text).toMatch(/Logros narrativos desbloqueados \(2\)/);
    expect(block).toContain('<time dateTime="2026-03-01T23:20:00Z">1 de mar de 2026, 18:20</time>');
    expect(text).toContain('Logro sin nombre disponible');
  });

  it('fase o capítulo ausentes: «No disponible», sin inventar valores', () => {
    const text = textOf(narrativeOf(render({ narrative: { narrative: { ...NARRATIVE, activePhaseName: null, lastCompletedChapterName: null } } })));

    expect(text).toMatch(/Fase narrativa activa No disponible/);
    expect(text).toMatch(/Último capítulo completado No disponible/);
  });

  it('logros vacíos y no disponibles se distinguen', () => {
    expect(textOf(narrativeOf(render({ narrative: { narrative: { ...NARRATIVE, achievements: [] } } })))).toMatch(/\(0\) Sin logros narrativos desbloqueados/);

    const unknown = textOf(narrativeOf(render({ narrative: { narrative: { ...NARRATIVE, achievements: null } } })));
    expect(unknown).toMatch(/Logros narrativos desbloqueados No disponible/);
    expect(unknown).not.toContain('Sin logros');
  });

  it('un logro con fecha no interpretable no inventa la fecha', () => {
    const text = textOf(narrativeOf(render({ narrative: { narrative: { ...NARRATIVE, achievements: [{ name: 'Logro X', unlockedAt: '2025-11-21 09:00' }] } } })));

    expect(text).toContain('Logro X Fecha no disponible');
  });

  it.each([
    [SECTION_STATUS.EMPTY, 'No existe progresión narrativa disponible para el participante consultado.', 'status', false],
    [SECTION_STATUS.DENIED, 'No tiene permisos para consultar la progresión narrativa individual del participante.', 'alert', false],
    [SECTION_STATUS.PERMISSION_REQUIRED, 'Se requiere permiso explícito para consultar la progresión narrativa individual.', 'alert', false],
    [SECTION_STATUS.NOT_FOUND, 'El participante seleccionado no existe.', 'alert', false],
    [SECTION_STATUS.OUTSIDE_COHORT, 'El participante ya no pertenece a esta cohorte.', 'alert', false],
    [SECTION_STATUS.INCONSISTENT, 'La progresión narrativa retornada no corresponde al participante solicitado.', 'alert', true],
    [SECTION_STATUS.UNAVAILABLE, 'El módulo de gamificación no se encuentra disponible en este momento.', 'alert', true],
    [SECTION_STATUS.ERROR, 'No fue posible cargar la progresión narrativa individual del participante.', 'alert', true],
  ])('%s: aviso propio sin datos de M06; el resto de la ficha sigue visible', (status, message, role, retry) => {
    const html = render({ narrative: { status, narrative: null } });
    const block = narrativeOf(html);

    expect(block).toMatch(new RegExp(`role="${role}"`));
    expect(textOf(block)).toContain(message);
    expect(block).not.toMatch(/Fase de prueba|Logro de prueba|<dl/);
    expect(block.includes('Reintentar progresión')).toBe(retry);
    expect(html).toContain('id="indicadores-principales"');
    expect(html).toContain('id="historial-alertas"');
    expect(textOf(notificationsOf(html))).toMatch(/Enviadas 35/);
  });

  it('acceso restringido en demostración: aclara que es simulado', () => {
    expect(textOf(narrativeOf(render({ narrative: { status: SECTION_STATUS.DENIED, narrative: null } })))).toContain('Resultado simulado por la fuente de demostración');
  });

  it('cargando: aviso accesible sin datos', () => {
    const block = narrativeOf(render({ narrative: { isLoading: true, status: null, narrative: null } }));

    expect(block).toMatch(/aria-busy="true"[\s\S]*role="status"[^>]*>Cargando la progresión narrativa/);
    expect(block).not.toContain('<dl');
  });
});

describe('Interacción con notificaciones (RF-131)', () => {
  it('muestra los cinco totales y las tres tasas', () => {
    const text = textOf(notificationsOf(render()));

    for (const label of ['Enviadas', 'Entregadas', 'Abiertas', 'Descartadas', 'Sesiones iniciadas desde una notificación', 'Tasa de apertura', 'Tasa de conversión a interacción', 'Tasa de descarte']) {
      expect(text).toContain(label);
    }
    expect(text).toMatch(/Enviadas 35/);
    expect(text).toMatch(/Tasa de apertura 0,4242/);
  });

  it('distingue cero real, dato ausente y no calculable', () => {
    const text = textOf(notificationsOf(render()));

    expect(text).toMatch(/Abiertas 0 /);
    expect(text).toMatch(/Tasa de descarte 0 /);
    expect(text).toMatch(/Descartadas No disponible/);
    expect(text).toMatch(/Sesiones iniciadas desde una notificación No calculable/);
    expect(text).toMatch(/Tasa de conversión a interacción No calculable/);
  });

  it('no convierte las tasas a porcentaje ni dibuja barras', () => {
    const block = notificationsOf(render());

    expect(textOf(block)).not.toMatch(/\d ?%/);
    expect(block).not.toContain('width:');
    expect(textOf(block)).toContain('sin convertir a porcentaje');
  });

  it('métricas parciales (200 de RF-131): lo indica; sin parciales no', () => {
    expect(textOf(notificationsOf(render()))).toContain('Algunas métricas de interacción con notificaciones no se encuentran disponibles para el periodo consultado.');
    expect(notificationsOf(render({ notifications: { interaction: { ...INTERACTION, hasNotCalculable: false } } }))).not.toContain('Métricas parciales');
  });

  it.each([
    [SECTION_STATUS.EMPTY, 'No existe historial de interacción con notificaciones para el participante consultado.', false],
    [SECTION_STATUS.DENIED, 'No tiene permisos para consultar el historial de interacción con notificaciones del participante.', false],
    [SECTION_STATUS.INCONSISTENT, 'El historial de notificaciones retornado no corresponde al participante solicitado.', true],
    [SECTION_STATUS.UNAVAILABLE, 'El módulo de notificaciones no se encuentra disponible en este momento.', true],
    [SECTION_STATUS.ERROR, 'No fue posible cargar el historial de interacción con notificaciones del participante.', true],
  ])('%s: aviso propio sin métricas; M06, la ficha y el historial siguen visibles', (status, message, retry) => {
    const html = render({ notifications: { status, interaction: null } });
    const block = notificationsOf(html);

    expect(textOf(block)).toContain(message);
    expect(block).not.toMatch(/Enviadas|Tasa de apertura|<dl/);
    expect(block.includes('Reintentar notificaciones')).toBe(retry);
    expect(textOf(narrativeOf(html))).toContain('Fase de prueba 2');
    expect(html).toContain('id="indicadores-principales"');
    expect(html).toContain('id="historial-alertas"');
  });
});

describe('Autorización independiente', () => {
  it('M06 denegado y M07 autorizado: solo se muestran las métricas', () => {
    const html = render({ narrative: { status: SECTION_STATUS.DENIED, narrative: null } });

    expect(textOf(narrativeOf(html))).toContain('Acceso restringido a la progresión narrativa');
    expect(narrativeOf(html)).not.toContain('Fase de prueba');
    expect(textOf(notificationsOf(html))).toMatch(/Enviadas 35/);
  });

  it('M07 denegado y M06 autorizado: solo se muestra la progresión', () => {
    const html = render({ notifications: { status: SECTION_STATUS.DENIED, interaction: null } });

    expect(textOf(notificationsOf(html))).toContain('Acceso restringido a las notificaciones');
    expect(notificationsOf(html)).not.toContain('Enviadas');
    expect(textOf(narrativeOf(html))).toContain('Fase de prueba 2');
  });

  it('ambas denegadas: ningún dato de M06 ni M07, la ficha sigue visible', () => {
    const html = render({ narrative: { status: SECTION_STATUS.DENIED, narrative: null }, notifications: { status: SECTION_STATUS.DENIED, interaction: null } });

    expect(html).not.toMatch(/Fase de prueba|Logro de prueba|Enviadas|Tasa de apertura/);
    expect(html).toContain('id="indicadores-principales"');
  });
});

describe('Solo lectura y privacidad', () => {
  it('sin formularios, campos ni botones; ningún enlace nuevo; sin acciones de modificación', () => {
    const html = render();

    expect(html).not.toMatch(/<form|<input|<select|<textarea|<button/);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(textOf(html)).not.toMatch(/Editar|Eliminar|Desbloquear|Reenviar|Enviar notificación|Cambiar fase|Avanzar|Marcar/);
  });

  it('identifica toda la ficha como solo lectura, incluidas gamificación y notificaciones', () => {
    expect(textOf(render())).toMatch(/la progresión narrativa y la interacción con notificaciones provienen de los módulos de seguimiento, gamificación y notificaciones, y no pueden modificarse desde aquí/);
  });

  it('no muestra datos personales, identificadores, nivel de gamificación ni contenido de mensajes', () => {
    expect(render()).not.toMatch(/@|uuid|demo-participante|ref-1"|nivel|mensaje ficticio|evento|diario|chat/i);
  });
});
