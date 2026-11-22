import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  DEMO_EVOLUTION_FORBIDDEN_FIELDS,
  DEMO_EVOLUTION_SERIES,
  DEMO_SCHEDULE_1_UNITS,
} from '../../data/cohortEvolutionDemoData.js';
import { interpretCohortEvolution } from '../../services/cohortEvolutionResponse.js';
import { EVOLUTION_STATUS as S } from '../../types/cohortEvolution.js';
import { EVOLUTION_MESSAGE } from '../../utils/evolutionMessages.js';
import { CohortEvolutionPage } from './CohortEvolutionPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

vi.mock('./hooks/useCohortEvolution.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortEvolution: (args) => {
      hook.args = args;
      return hook.value ?? actual.useCohortEvolution(args);
    },
  };
});

const COHORT_ID = 'demo-cohorte-b';
const BASE_SERIES = DEMO_EVOLUTION_SERIES[COHORT_ID];

const interpreted = (changes = {}) =>
  interpretCohortEvolution(
    {
      id_cohorte: COHORT_ID,
      ...BASE_SERIES,
      unidades_con_datos_insuficientes: [],
      fecha_actualizacion: '2026-11-21T12:00:00Z',
      ...DEMO_EVOLUTION_FORBIDDEN_FIELDS,
      ...changes,
    },
    DEMO_SCHEDULE_1_UNITS,
    COHORT_ID,
  );

// Serie con la unidad 3 sin datos.
const withGap = () =>
  interpreted({
    serie_adherencia_promedio: BASE_SERIES.serie_adherencia_promedio.map(
      (v, i) => (i === 2 ? null : v),
    ),
    serie_nivel_progreso_distribucion:
      BASE_SERIES.serie_nivel_progreso_distribucion.map((v, i) =>
        i === 2 ? null : v,
      ),
    serie_craving_promedio: BASE_SERIES.serie_craving_promedio.map((v, i) =>
      i === 2 ? null : v,
    ),
    unidades_con_datos_insuficientes: [
      BASE_SERIES.serie_unidades_temporales[2],
    ],
  });

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
      initialEntries={[`/app/administrativo/cohortes/${cohortId}/evolucion`]}
    >
      <Routes>
        <Route
          path="/app/administrativo/cohortes/:idCohorte/evolucion"
          element={<CohortEvolutionPage />}
        />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// Fragmento de una sección por su encabezado.
const sectionOf = (html, id) => {
  const start = html.indexOf(`aria-labelledby="${id}-titulo"`);
  const end = html.indexOf('</section>', start);
  return html.slice(start, end);
};

afterEach(() => {
  hook.value = null;
  hook.args = null;
  vi.unstubAllEnvs();
});

describe('Evolución temporal (RF-141): presentación', () => {
  it('tres gráficos en orden: adherencia, distribución de progreso y craving', () => {
    const html = render({ view: interpreted() });
    const order = [
      'Adherencia promedio',
      'Distribución por nivel de progreso',
      'Craving promedio',
    ].map((title) => html.indexOf(`${title}</h2>`));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('adherencia: un punto por unidad con su valor original', () => {
    const block = sectionOf(
      render({ view: interpreted() }),
      'evolucion-adherencia',
    );

    expect(block.match(/data-point/g)).toHaveLength(6);
    expect(textOf(block)).toContain('Semana 6: 0,7342');
    expect(textOf(block)).toContain('Semana 1: 0,82');
    expect(textOf(block)).not.toContain('%');
  });

  it('craving: gráfico propio con valores originales', () => {
    const block = sectionOf(
      render({ view: interpreted() }),
      'evolucion-craving',
    );

    expect(block.match(/data-point/g)).toHaveLength(6);
    expect(textOf(block)).toContain('Semana 4: 5,2');
    expect(textOf(block)).not.toContain('0,7342');
  });

  it('distribución: barras por nivel con la cantidad original, sin porcentajes ni totales', () => {
    const block = sectionOf(
      render({ view: interpreted() }),
      'evolucion-progreso',
    );

    expect(block.match(/data-bar="/g)).toHaveLength(24);
    expect(textOf(block)).toContain(
      'Semana 6: Inicial 3, En avance 9, Avanzado 4, Completado 2',
    );
    expect(textOf(block)).not.toMatch(/%|Total/);
    expect(textOf(block)).toMatch(
      /I Inicial .*E En avance .*A Avanzado .*C Completado/,
    );
  });

  it('unidades en el orden oficial del cronograma, con la etiqueta del catálogo', () => {
    const text = textOf(render({ view: interpreted() }));

    expect(text).toMatch(
      /Semana 1 .*Semana 2 .*Semana 3 .*Semana 4 .*Semana 5 .*Semana 6/,
    );
    expect(text).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it('tabla accesible con los mismos valores', () => {
    const html = render({ view: interpreted() });

    expect(html).toContain('<details');
    expect(html).toMatch(/<summary class="[^"]*min-h-\[44px\]/);
    expect(textOf(html)).toContain('Semana 6 0,7342 3 9 4 2 4,6');
  });

  it('fecha de actualización y eje por unidades, no por calendario', () => {
    const text = textOf(render({ view: interpreted() }));

    expect(text).toContain(
      'Actualizado el 21 de nov de 2026, 07:00 (hora de Colombia',
    );
    expect(text).toContain('Eje horizontal: unidades del cronograma');
  });
});

describe('Evolución temporal (RF-141): vacíos y ceros', () => {
  it('la unidad sin datos conserva su posición, se marca y no se une con línea', () => {
    const html = render({ view: withGap() });
    const block = sectionOf(html, 'evolucion-adherencia');

    expect(textOf(html)).toContain(EVOLUTION_MESSAGE.GAPS);
    expect(block.match(/data-point/g)).toHaveLength(5);
    // 6 unidades con la 3 vacía: solo se unen 1-2, 4-5 y 5-6.
    expect(block.match(/data-segment/g)).toHaveLength(3);
    expect(block.match(/data-gap/g)).toHaveLength(1);
    expect(textOf(block)).toContain('Semana 3: Sin datos');
  });

  it('una distribución ausente se muestra «Sin datos», no como ceros', () => {
    const block = sectionOf(render({ view: withGap() }), 'evolucion-progreso');

    expect(block.match(/data-gap/g)).toHaveLength(1);
    expect(textOf(block)).toContain('Semana 3: Sin datos');
    expect(block.match(/data-bar="/g)).toHaveLength(20);
  });

  it('el cero real se dibuja; null no', () => {
    const view = interpreted({
      serie_adherencia_promedio: [0, null, 0.74, 0.71, 0.73, 0.7342],
    });
    const block = sectionOf(render({ view }), 'evolucion-adherencia');

    expect(textOf(block)).toContain('Semana 1: 0');
    expect(textOf(block)).toContain('Semana 2: Sin datos');
    expect(block.match(/data-point/g)).toHaveLength(5);
  });
});

describe('Evolución temporal (RF-141): estados', () => {
  it.each([
    [S.INSUFFICIENT_UNITS, EVOLUTION_MESSAGE.INSUFFICIENT_UNITS, false],
    [S.NOT_FOUND, EVOLUTION_MESSAGE.NOT_FOUND, true],
    [S.FORBIDDEN, EVOLUTION_MESSAGE.FORBIDDEN, true],
    [S.UNAVAILABLE, EVOLUTION_MESSAGE.UNAVAILABLE, true],
    [S.ERROR, EVOLUTION_MESSAGE.ERROR, true],
  ])('%s: mensaje oficial y ningún gráfico', (status, message, isAlert) => {
    const html = render({ view: { status, units: [] } });

    expect(html).toContain(message);
    expect(html).not.toContain('data-point');
    expect(html).not.toContain('data-bar');
    expect(html.includes('role="alert"')).toBe(isAlert);
  });

  it('menos de dos unidades es un estado funcional, sin reintento', () => {
    expect(
      render({ view: { status: S.INSUFFICIENT_UNITS, units: [] } }),
    ).not.toContain('Reintentar');
  });

  it('M05 no disponible: se puede reintentar', () => {
    expect(render({ view: { status: S.UNAVAILABLE, units: [] } })).toContain(
      'Reintentar',
    );
  });

  it('sin cohorte activa: acceso a la gestión de cohortes', () => {
    expect(render({ view: { status: S.NOT_FOUND, units: [] } })).toContain(
      'href="/app/administrativo/cohortes"',
    );
  });

  it('filtros sin resultados: mensaje oficial y filtros visibles, sin gráficos', () => {
    const html = render({
      view: {
        status: S.NO_FILTER_RESULTS,
        units: [],
        filters: {
          therapyModality: 'PERSONALIZADA',
          dateRange: { from: '2026-09-01', to: '2026-09-30' },
        },
      },
    });

    expect(html).toContain(EVOLUTION_MESSAGE.NO_FILTER_RESULTS);
    expect(textOf(html)).toContain(
      'Filtros aplicados Modalidad terapéutica: PERSONALIZADA',
    );
    expect(html).not.toContain('data-point');
  });

  it('sin datos en ninguna unidad: estado funcional', () => {
    const html = render({ view: { status: S.NO_DATA, units: [] } });

    expect(html).toContain('Sin datos consolidados');
    expect(html).not.toContain('role="alert"');
  });

  it('carga e integración pendiente', () => {
    expect(render({ isLoading: true })).toContain(
      'Cargando la evolución temporal...',
    );

    const pending = render({ isDemo: false, isIntegrationPending: true });
    expect(pending).toContain('Integración pendiente');
    expect(pending).not.toContain('Datos de demostración');
  });

  it('sin el modo demostración no consulta nada y no muestra datos', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', '');
    const html = render(null);

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('data-point');
  });
});

describe('Evolución temporal (RF-141): privacidad, accesibilidad y navegación', () => {
  it('no muestra datos individuales', () => {
    const html = render({ view: interpreted() });

    expect(html).not.toMatch(
      /PART-\d|example\.com|0000000000ee|ficticio|Texto ficticio/,
    );
    expect(
      [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ).toEqual(['/app/administrativo/cohortes/demo-cohorte-b']);
  });

  it('el desplazamiento horizontal queda dentro del área gráfica', () => {
    const html = render({ view: interpreted() });

    expect(
      html.match(/overflow-x-auto overflow-y-hidden/g).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('animaciones solo de entrada y desactivadas con movimiento reducido', () => {
    const html = render({ view: interpreted() });
    const animated = [...html.matchAll(/class="([^"]*starting:[^"]*)"/g)];

    expect(animated.length).toBeGreaterThan(0);
    for (const [, className] of animated) {
      expect(className).toContain('motion-reduce:transition-none');
    }
  });

  it('consulta la cohorte de la ruta', () => {
    render({ view: null }, 'demo-cohorte-c');
    expect(hook.args).toEqual({ cohortId: 'demo-cohorte-c' });
  });
});
