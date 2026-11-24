import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  DEMO_NARRATIVE_DATA,
  DEMO_NARRATIVE_FORBIDDEN_FIELDS,
} from '../../data/narrativeAggregateDemoData.js';
import { interpretNarrativeAggregate } from '../../services/narrativeAggregateResponse.js';
import { AGGREGATE_VIEW_STATUS as S } from '../../types/behavioralAggregate.js';
import { CohortNarrativePage } from './CohortNarrativePage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

vi.mock('./hooks/useCohortNarrative.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortNarrative: (args) => {
      hook.args = args;
      return hook.value ?? actual.useCohortNarrative(args);
    },
  };
});

const COHORT_ID = 'demo-cohorte-b';

// Vista interpretada con el servicio real, a partir de una respuesta del
// contrato que incluye datos narrativos individuales prohibidos.
const interpreted = (changes = {}) =>
  interpretNarrativeAggregate(
    {
      id_cohorte: COHORT_ID,
      estado: 'DISPONIBLE',
      estado_agregacion: 'ACTUALIZADO',
      ultimo_timestamp_disponible: '2026-11-20T11:30:00Z',
      motivo_sin_datos: null,
      mensaje: null,
      datos: {
        ...DEMO_NARRATIVE_DATA[COHORT_ID],
        ...DEMO_NARRATIVE_FORBIDDEN_FIELDS,
      },
      ...DEMO_NARRATIVE_FORBIDDEN_FIELDS,
      ...changes,
    },
    COHORT_ID,
  );

const withData = (datos) =>
  interpreted({ datos: { ...DEMO_NARRATIVE_DATA[COHORT_ID], ...datos } });

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
        `/app/administrativo/cohortes/${cohortId}/vista-narrativa`,
      ]}
    >
      <Routes>
        <Route
          path="/app/administrativo/cohortes/:idCohorte/vista-narrativa"
          element={<CohortNarrativePage />}
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

describe('Vista narrativa agregada (RF-133): presentación', () => {
  it('datos disponibles: cohorte consultada, tres fases, graduación, logros y fecha', () => {
    const text = textOf(render({ view: interpreted() }));

    expect(text).toContain('Progresión narrativa y gamificación');
    expect(text).toContain('Cohorte consultada Cohorte Piloto B');
    expect(text).toMatch(/Inicio 6 .*Desarrollo 9 .*Cierre 3/);
    expect(text).toContain('Programa completado 2');
    expect(text).toContain('Usuarios con logros 13');
    expect(text).toContain('Logros desbloqueados 41');
    expect(text).toContain('no identifican a ningún participante');
    expect(text).toContain(
      'Actualizado el 20 de nov de 2026, 06:30 (hora de Colombia',
    );
  });

  it('la distribución por fases va primero', () => {
    const html = render({ view: interpreted() });

    expect(html.indexOf('Distribución por fase narrativa')).toBeLessThan(
      html.indexOf('Graduación y logros'),
    );
  });

  it('presenta los valores sin recalcularlos: ni sumas, ni porcentajes', () => {
    const text = textOf(
      render({
        view: withData({
          distribucion_por_fase_narrativa: [
            { fase: 'INICIO', total: 1 },
            { fase: 'DESARROLLO', total: 2 },
            { fase: 'CIERRE', total: 3 },
          ],
          total_logros_desbloqueados: 1234,
        }),
      }),
    );

    expect(text).toMatch(/Inicio 1 .*Desarrollo 2 .*Cierre 3/);
    expect(text).toContain('Logros desbloqueados 1.234');
    expect(text).not.toMatch(/%|\b6\b|Total en fases/);
  });

  it('un cero real se muestra como 0 y un dato ausente como «No disponible»', () => {
    const text = textOf(
      render({
        view: withData({
          total_usuarios_programa_completado: 0,
          total_usuarios_con_logros: null,
        }),
      }),
    );

    expect(text).toContain('Programa completado 0');
    expect(text).toContain('Usuarios con logros No disponible');
  });

  it('el total de usuarios de la cohorte solo aparece si M06 lo entrega', () => {
    expect(render({ view: interpreted() })).not.toContain(
      'Usuarios de la cohorte',
    );
    expect(
      textOf(render({ view: withData({ total_usuarios_cohorte: 20 }) })),
    ).toContain('Usuarios de la cohorte 20');
  });

  it('usuarios sin perfil narrativo: aviso de M06 sin bloquear los agregados', () => {
    const text = textOf(
      render({
        view: interpreted({
          mensaje:
            'Algunos usuarios de la cohorte no cuentan con perfil narrativo activo y no se incluyen en la distribución por fase.',
        }),
      }),
    );

    expect(text).toContain('Aviso del módulo de gamificación');
    expect(text).toContain('no se incluyen en la distribución por fase');
    expect(text).toMatch(/Inicio 6 .*Desarrollo 9 .*Cierre 3/);
  });

  it('sin consolidar: estado funcional, sin error ni reintento', () => {
    const html = render({
      view: interpreted({
        motivo_sin_datos: 'SIN_CONSOLIDAR',
        estado_agregacion: 'PENDIENTE',
        datos: null,
        mensaje: 'Mensaje de M06.',
      }),
    });

    expect(html).toContain('Progresión narrativa aún no consolidada');
    expect(html).toContain('Mensaje de M06.');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Reintentar');
    expect(html).not.toContain('Graduación y logros');
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
    expect(text).toContain('Los datos de gamificación no están actualizados');
    expect(html).toContain('dateTime="2026-11-20T11:30:00Z"');
    expect(text).toContain('Logros desbloqueados 41');
  });

  it('M06 no disponible sin vista anterior: sin datos y con reintento', () => {
    const html = render({
      view: interpreted({
        estado: 'NO_DISPONIBLE',
        datos: null,
        ultimo_timestamp_disponible: null,
      }),
    });

    expect(html).toContain('Vista narrativa no disponible');
    expect(html).toContain('El módulo de gamificación no está disponible');
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Graduación y logros');
  });

  it.each([
    [S.INCONSISTENT, 'no corresponde a la cohorte solicitada'],
    [S.NOT_FOUND, 'Cohorte no encontrada'],
    [S.ERROR, 'No fue posible consultar la progresión narrativa agregada'],
  ])('situación %s', (status, expected) => {
    expect(render({ view: { status, data: null } })).toContain(expected);
  });

  it('carga: anuncio accesible y sección ocupada', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando la vista narrativa...');
  });

  it('integración pendiente: sin datos ni aviso de demostración', () => {
    const html = render({ isDemo: false, isIntegrationPending: true });

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('Datos de demostración');
    expect(html).not.toContain('Indicadores narrativos');
  });

  it('demostración: lo indica de forma visible', () => {
    expect(render({ view: interpreted() })).toContain('Datos de demostración');
  });
});

describe('Vista narrativa agregada (RF-133): privacidad', () => {
  it('no muestra identificadores, perfiles, capítulos ni logros individuales', () => {
    const html = render({ view: interpreted() });

    expect(html).not.toMatch(
      /PART-\d|example\.com|0000000000bb|ficticio|Capítulo|Logro ficticio/,
    );
    expect(html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    expect(
      [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ).toEqual(['/app/administrativo/cohortes/demo-cohorte-b']);
  });
});

describe('Vista narrativa agregada (RF-133): cohorte', () => {
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
});
