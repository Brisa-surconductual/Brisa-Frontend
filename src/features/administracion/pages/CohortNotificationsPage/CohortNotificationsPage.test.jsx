import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  DEMO_NOTIFICATION_DATA,
  DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
  DEMO_NOTIFICATION_NO_SENDS,
} from '../../data/notificationAggregateDemoData.js';
import { interpretNotificationAggregate } from '../../services/notificationAggregateResponse.js';
import { AGGREGATE_VIEW_STATUS as S } from '../../types/behavioralAggregate.js';
import { CohortNotificationsPage } from './CohortNotificationsPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

vi.mock('./hooks/useCohortNotifications.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortNotifications: (args) => {
      hook.args = args;
      return hook.value ?? actual.useCohortNotifications(args);
    },
  };
});

const COHORT_ID = 'demo-cohorte-b';

// Vista interpretada con el servicio real, a partir de una respuesta del
// contrato que incluye datos individuales prohibidos.
const interpreted = (changes = {}) =>
  interpretNotificationAggregate(
    {
      id_cohorte: COHORT_ID,
      estado: 'DISPONIBLE',
      estado_agregacion: 'ACTUALIZADO',
      ultimo_timestamp_disponible: '2026-11-20T12:15:00Z',
      motivo_sin_datos: null,
      mensaje: null,
      datos: {
        ...DEMO_NOTIFICATION_DATA[COHORT_ID],
        ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
      },
      ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
      ...changes,
    },
    COHORT_ID,
  );

const withData = (datos) =>
  interpreted({ datos: { ...DEMO_NOTIFICATION_DATA[COHORT_ID], ...datos } });

const BASE = Object.freeze({
  cohort: { id: COHORT_ID, name: 'Cohorte Piloto B' },
  view: null,
  isLoading: false,
  isDemo: true,
  isIntegrationPending: false,
  retry: vi.fn(),
});

function render(changes, cohortId = COHORT_ID) {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[
        `/app/administrativo/cohortes/${cohortId}/vista-notificaciones`,
      ]}
    >
      <Routes>
        <Route
          path="/app/administrativo/cohortes/:idCohorte/vista-notificaciones"
          element={<CohortNotificationsPage />}
        />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

afterEach(() => {
  hook.value = null;
  hook.args = null;
  vi.unstubAllEnvs();
});

describe('Efectividad de notificaciones (RF-134): presentación', () => {
  it('datos disponibles: cohorte consultada, cinco indicadores y fecha', () => {
    const text = textOf(render({ view: interpreted() }));

    expect(text).toContain('Efectividad de notificaciones');
    expect(text).toContain('Cohorte consultada Cohorte Piloto B');
    expect(text).toContain('Tasa de apertura promedio 0,5825');
    expect(text).toContain('Tasa de conversión promedio 0,3125');
    expect(text).toContain('Enviadas 412');
    expect(text).toContain('Entregadas 398');
    expect(text).toContain('Descartadas 21');
    expect(text).toContain('no identifican a ningún participante');
    expect(text).toContain(
      'Actualizado el 20 de nov de 2026, 07:15 (hora de Colombia',
    );
  });

  it('las tasas van primero y después los totales', () => {
    const html = render({ view: interpreted() });

    expect(html.indexOf('Tasas promedio')).toBeLessThan(
      html.indexOf('Notificaciones de la cohorte'),
    );
  });

  it('presenta los valores sin recalcularlos: ni porcentajes, ni redondeo, ni diferencias', () => {
    const text = textOf(
      render({
        view: withData({
          tasa_apertura_promedio: 0.666666,
          total_notificaciones_enviadas: 1260,
          total_notificaciones_entregadas: 1198,
          total_notificaciones_descartadas: 62,
        }),
      }),
    );

    expect(text).toContain('Tasa de apertura promedio 0,666666');
    expect(text).toContain('Enviadas 1.260');
    expect(text).not.toMatch(/%|66,67|\b62\b.*\b62\b|No entregadas/);
  });

  it('cero envíos con tasas null: totales en 0, tasas «No disponible» y sin error', () => {
    const html = render({
      view: interpreted({ datos: DEMO_NOTIFICATION_NO_SENDS }),
    });
    const text = textOf(html);

    expect(text).toContain('Tasa de apertura promedio No disponible');
    expect(text).toContain('Tasa de conversión promedio No disponible');
    expect(text).toContain('Enviadas 0');
    expect(text).toContain('Entregadas 0');
    expect(text).toContain('Descartadas 0');
    expect(html).not.toContain('role="alert"');
    expect(text).not.toContain('aún no consolidadas');
  });

  it('usuarios sin métricas calculables: aviso de M07 sin bloquear el agregado', () => {
    const text = textOf(
      render({
        view: interpreted({
          mensaje:
            'Algunos usuarios de la cohorte no cuentan con métricas de efectividad calculables y fueron excluidos del promedio agregado.',
        }),
      }),
    );

    expect(text).toContain('Aviso del módulo de notificaciones');
    expect(text).toContain('excluidos del promedio agregado');
    expect(text).toContain('Tasa de apertura promedio 0,5825');
  });

  it('sin consolidar: estado funcional, sin error ni reintento ni indicadores', () => {
    const html = render({
      view: interpreted({
        estado_agregacion: 'PENDIENTE',
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        datos: null,
        mensaje: 'Mensaje de M07.',
      }),
    });

    expect(html).toContain('Métricas aún no consolidadas');
    expect(html).toContain('Mensaje de M07.');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Reintentar');
    expect(html).not.toContain('Enviadas');
  });

  it('desactualizada: marca, aviso con la última fecha y la última vista', () => {
    const html = render({
      view: interpreted({
        estado: 'DESACTUALIZADA',
        estado_agregacion: 'ERROR_ACTUALIZACION',
      }),
    });
    const text = textOf(html);

    expect(text).toContain('Desactualizado');
    expect(text).toContain('Modo degradado: datos desactualizados');
    expect(text).toContain('Los datos de notificaciones no están actualizados');
    expect(html).toContain('dateTime="2026-11-20T12:15:00Z"');
    expect(text).toContain('Enviadas 412');
  });

  it('M07 no disponible sin vista anterior: sin datos y con reintento', () => {
    const html = render({
      view: interpreted({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    });

    expect(html).toContain('Vista de notificaciones no disponible');
    expect(html).toContain('El módulo de notificaciones no está disponible');
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Enviadas');
  });

  it.each([
    [S.ERROR, 'No fue posible consultar las métricas de efectividad'],
    [S.INCONSISTENT, 'no corresponde a la cohorte solicitada'],
    [S.NOT_FOUND, 'Cohorte no encontrada'],
  ])('situación %s', (status, expected) => {
    const html = render({ view: { status, data: null } });

    expect(html).toContain(expected);
    expect(html).not.toContain('Enviadas');
  });

  it('carga: anuncio accesible y sección ocupada', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando la vista de notificaciones...');
  });

  it('integración pendiente: sin datos ni aviso de demostración', () => {
    const html = render({ isDemo: false, isIntegrationPending: true });

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('Datos de demostración');
    expect(html).not.toContain('Indicadores de notificaciones');
  });

  it('demostración: lo indica de forma visible', () => {
    expect(render({ view: interpreted() })).toContain('Datos de demostración');
  });
});

describe('Efectividad de notificaciones (RF-134): privacidad', () => {
  it('no muestra identificadores, historial, contenido ni tipos de mensajes', () => {
    const html = render({ view: interpreted() });

    expect(html).not.toMatch(
      /PART-\d|example\.com|0000000000c|ficticio|RECORDATORIO|ABIERTA|Tasa de descarte/,
    );
    expect(html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    expect(
      [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ).toEqual(['/app/administrativo/cohortes/demo-cohorte-b']);
  });
});

describe('Efectividad de notificaciones (RF-134): cohorte', () => {
  it('consulta la cohorte de la ruta y vuelve a ella', () => {
    const html = render(
      { cohort: { id: 'demo-cohorte-c', name: 'Cohorte Piloto C' } },
      'demo-cohorte-c',
    );

    expect(hook.args).toEqual({ cohortId: 'demo-cohorte-c' });
    expect(html).toContain(
      'href="/app/administrativo/cohortes/demo-cohorte-c"',
    );
  });

  it('sin demostración inicia en carga del backend', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');
    const html = render(null);

    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('Integración pendiente');
    expect(html).not.toContain('Enviadas');
  });
});
