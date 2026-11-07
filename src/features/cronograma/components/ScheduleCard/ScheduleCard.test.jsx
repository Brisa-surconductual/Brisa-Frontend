import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link, MemoryRouter } from 'react-router-dom';

import { ScheduleCard } from './ScheduleCard.jsx';

const SCHEDULE = Object.freeze({
  idCronograma: 'qa-1',
  nombreCronograma: 'Cronograma QA',
  estado: 'ACTIVO',
  esBase: true,
  fechaCreacion: '2026-11-02T00:00:00.000Z',
});
const PANEL = '/app/administrativo/cronograma/qa-1/panel';

function render(schedule = SCHEDULE) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ScheduleCard schedule={schedule} panelPath={PANEL} />
    </MemoryRouter>,
  );
}

function findLink(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === Link) return node;
  for (const child of [].concat(node.props?.children ?? [])) {
    const found = findLink(child);
    if (found) return found;
  }
  return null;
}

describe('Tarjeta de cronograma accesible', () => {
  it('abre el panel con un enlace real, accesible por teclado', () => {
    const html = render();

    expect(html).toMatch(/<a [^>]*href="\/app\/administrativo\/cronograma\/qa-1\/panel"/);
    expect(html).not.toMatch(/<div[^>]*onclick/i);
    expect(html).toContain('<article');
  });

  it('el enlace se anuncia con el nombre del cronograma', () =>
    expect(render()).toMatch(/Ver panel de gestión<span class="sr-only"> de Cronograma QA<\/span>/));

  it('conserva el state de navegación con el cronograma', () => {
    const link = findLink(ScheduleCard({ schedule: SCHEDULE, panelPath: PANEL }));

    expect(link.props.to).toBe(PANEL);
    expect(link.props.state).toEqual({ schedule: SCHEDULE });
  });

  it('muestra nombre, estado con texto, tipo y fecha', () => {
    const html = render();

    expect(html).toContain('Cronograma QA</h3>');
    expect(html).toContain('Activo');
    expect(html).toContain('Cronograma base');
    expect(html).toContain('2026-11-02');
  });

  it('no inventa estados: muestra un valor desconocido tal cual', () =>
    expect(render({ ...SCHEDULE, estado: 'OTRO' })).toContain('OTRO'));

  it('indica la ausencia de fecha', () =>
    expect(render({ ...SCHEDULE, fechaCreacion: null, esBase: false })).toMatch(
      /Cronograma estándar[\s\S]*Sin fecha/,
    ));

  it('no contiene interactivos anidados', () => {
    const html = render();

    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).not.toContain('<button');
  });
});
