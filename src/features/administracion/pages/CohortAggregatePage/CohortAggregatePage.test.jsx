import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DEMO_AGGREGATE_DATA } from '../../data/behavioralAggregateDemoData.js';
import { DEMO_FORBIDDEN_FIELDS } from '../../data/behavioralAggregateDemoData.js';
import { interpretBehavioralAggregate } from '../../services/behavioralAggregateResponse.js';
import { AGGREGATE_VIEW_STATUS as S } from '../../types/behavioralAggregate.js';
import { CohortAggregatePage } from './CohortAggregatePage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

vi.mock('./hooks/useCohortAggregate.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortAggregate: (args) => {
      hook.args = args;
      return hook.value ?? actual.useCohortAggregate(args);
    },
  };
});

const COHORT_ID = 'demo-cohorte-b';

// Vista interpretada con el servicio real, a partir de una respuesta del
// contrato que incluye campos individuales prohibidos.
const interpreted = (changes = {}) =>
  interpretBehavioralAggregate(
    {
      id_cohorte: COHORT_ID,
      estado: 'DISPONIBLE',
      estado_agregacion: 'ACTUALIZADO',
      ultimo_timestamp_disponible: '2026-11-20T13:00:00Z',
      motivo_sin_datos: null,
      mensaje: null,
      datos: { ...DEMO_AGGREGATE_DATA[COHORT_ID], ...DEMO_FORBIDDEN_FIELDS },
      ...DEMO_FORBIDDEN_FIELDS,
      ...changes,
    },
    COHORT_ID,
  );

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
        `/app/administrativo/cohortes/${cohortId}/vista-agregada`,
      ]}
    >
      <Routes>
        <Route
          path="/app/administrativo/cohortes/:idCohorte/vista-agregada"
          element={<CohortAggregatePage />}
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

describe('Vista agregada conductual (RF-132): presentación', () => {
  it('datos disponibles: cohorte consultada, alertas, participación, adherencia y distribución', () => {
    const text = textOf(render({ view: interpreted() }));

    expect(text).toContain('Vista agregada conductual');
    expect(text).toContain('Cohorte consultada Cohorte Piloto B');
    expect(text).toContain('Alertas de inactividad 2');
    expect(text).toContain('Alertas de craving elevado 1');
    expect(text).toContain('Participantes activos 18');
    expect(text).toMatch(/Inicial 3 .*En avance 9 .*Avanzado 4 .*Completado 2/);
    expect(text).toContain(
      'Datos agregados de la cohorte: no identifican a ningún participante.',
    );
    expect(text).toContain(
      'Actualizado el 20 de nov de 2026, 08:00 (hora de Colombia',
    );
  });

  it('las alertas pendientes van primero (usabilidad de RF-132)', () => {
    const html = render({ view: interpreted() });

    expect(html.indexOf('Alertas pendientes')).toBeLessThan(
      html.indexOf('Participación y adherencia'),
    );
    expect(html.indexOf('Participación y adherencia')).toBeLessThan(
      html.indexOf('Distribución por nivel de progreso'),
    );
  });

  it('presenta los valores sin recalcularlos: ni porcentajes, ni sumas, ni redondeo', () => {
    const view = interpreted({
      datos: {
        ...DEMO_AGGREGATE_DATA[COHORT_ID],
        total_usuarios_activos: 25,
        tasa_adherencia_promedio: 0.666666,
      },
    });
    const text = textOf(render({ view }));

    expect(text).toContain('Participantes activos 25');
    expect(text).toContain('0,666666');
    expect(text).not.toMatch(/%|Total de alertas|\b3 alertas\b/);
  });

  it('un cero real se muestra como 0 y un dato ausente como «No disponible»', () => {
    const view = interpreted({
      datos: {
        ...DEMO_AGGREGATE_DATA[COHORT_ID],
        alertas_inactividad_pendientes: 0,
        tasa_adherencia_promedio: null,
      },
    });
    const text = textOf(render({ view }));

    expect(text).toContain('Alertas de inactividad 0');
    expect(text).toContain('Adherencia promedio No disponible');
  });

  it('sin consolidar: estado funcional, sin error ni reintento, con el mensaje recibido', () => {
    const html = render({
      view: interpreted({
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        estado_agregacion: 'PENDIENTE',
        datos: null,
        mensaje: 'Mensaje de la fuente.',
      }),
    });

    expect(html).toContain('Indicadores aún no consolidados');
    expect(html).toContain('Mensaje de la fuente.');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Reintentar');
    expect(html).not.toContain('Alertas pendientes');
  });

  it('desactualizada: marca, aviso con la última fecha y la última vista', () => {
    const html = render({
      view: interpreted({
        estado: 'DESACTUALIZADA',
        ultimo_timestamp_disponible: '2026-11-19T22:15:00Z',
      }),
    });
    const text = textOf(html);

    expect(text).toContain('Desactualizado');
    expect(text).toContain('Modo degradado: datos desactualizados');
    expect(html).toContain('dateTime="2026-11-19T22:15:00Z"');
    expect(text).toContain('Participantes activos 18');
  });

  it('desactualizada sin fecha informada: lo dice sin inventar una', () => {
    const text = textOf(
      render({
        view: interpreted({
          estado: 'DESACTUALIZADA',
          ultimo_timestamp_disponible: null,
        }),
      }),
    );

    expect(text).toContain('Datos desactualizados');
    expect(text).toContain('sin fecha informada');
  });

  it('no disponible sin vista anterior: sin datos y con reintento', () => {
    const html = render({
      view: interpreted({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    });

    expect(html).toContain('Vista agregada no disponible');
    expect(html).toContain('no hay una vista anterior para mostrar');
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Alertas pendientes');
  });

  it('agregado suprimido: sin datos y sin mencionar ningún umbral', () => {
    const text = textOf(
      render({
        view: interpreted({
          estado: 'NO_DISPONIBLE',
          motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
          datos: null,
        }),
      }),
    );

    expect(text).toContain('Vista no mostrada por privacidad');
    expect(text).not.toMatch(/menos de|N\s*<|cinco|\b5\b participantes/);
    expect(text).not.toContain('Alertas pendientes');
  });

  it.each([
    [S.INCONSISTENT, 'no corresponde a la cohorte solicitada'],
    [S.NOT_FOUND, 'Cohorte no encontrada'],
    [S.ERROR, 'No pudimos cargar la vista agregada'],
  ])('situación %s', (status, expected) => {
    expect(render({ view: { status, data: null } })).toContain(expected);
  });

  it('carga: anuncio accesible y sección ocupada', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando la vista agregada...');
  });

  it('integración pendiente: sin datos ni aviso de demostración', () => {
    const html = render({ isDemo: false, isIntegrationPending: true });

    expect(html).toContain('Información aún no disponible');
    expect(html).not.toContain('Datos de demostración');
    expect(html).not.toContain('Indicadores agregados');
  });

  it('demostración: lo indica de forma visible', () => {
    expect(render({ view: interpreted() })).toContain('Datos de demostración');
  });
});

describe('Vista agregada conductual (RF-132): privacidad', () => {
  it('no muestra identificadores individuales ni enlaza a fichas', () => {
    const html = render({ view: interpreted() });

    expect(html).not.toMatch(
      /PART-\d|example\.com|0000000000aa|Participante ficticio/,
    );
    expect(html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    expect(html).not.toContain('/seguimiento/');
    expect(
      [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ).toEqual(['/app/administrativo/cohortes/demo-cohorte-b']);
  });
});

describe('Vista agregada conductual (RF-132): cohorte', () => {
  it('consulta la cohorte de la ruta y vuelve a ella', () => {
    const html = render(
      {
        view: null,
        cohort: { id: 'demo-cohorte-c', name: 'Cohorte Piloto C' },
      },
      'demo-cohorte-c',
    );

    expect(hook.args).toEqual({ cohortId: 'demo-cohorte-c' });
    expect(html).toContain(
      'href="/app/administrativo/cohortes/demo-cohorte-c"',
    );
  });
});
