import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { TemporalUnitCard } from './TemporalUnitCard.jsx';
import { TemporalUnitList } from '../TemporalUnitList/TemporalUnitList.jsx';

const UNIT = Object.freeze({
  idUnidadTemporal: 'u-1',
  nombreUnidadTemporal: 'Semana QA',
  orden: 2,
  fechaInicio: '2026-11-02T00:00:00.000Z',
  fechaFin: '2026-11-08T00:00:00.000Z',
  status: 'ACTIVA',
  esUtilizadoPorUsuario: true,
});

const render = (unit = UNIT) =>
  renderToStaticMarkup(<TemporalUnitCard unit={unit} onViewDetails={() => {}} />);

describe('Tarjeta de unidad temporal', () => {
  it('conserva orden, nombre, fechas y uso', () => {
    const html = render();

    expect(html).toContain('Semana QA</h3>');
    expect(html).toMatch(/Orden <\/span>2/);
    expect(html).toContain('2026-11-02 — 2026-11-08');
    expect(html).toContain('En uso');
  });

  it.each([
    ['ACTIVA', 'Activa'],
    ['COMPLETADA', 'Completada'],
    ['BLOQUEADA', 'Bloqueada'],
    ['POR_DEFINIR', 'Por definir'],
  ])('muestra el estado %s con su etiqueta', (status, label) =>
    expect(render({ ...UNIT, status })).toContain(label));

  it('el detalle es un botón con nombre accesible', () =>
    expect(render()).toMatch(
      /<button type="button"[^>]*>Ver detalles<span class="sr-only"> de Semana QA<\/span>/,
    ));

  it('la lista entrega la unidad al abrir el detalle', () => {
    const onViewDetails = vi.fn();
    const list = TemporalUnitList({ units: [UNIT], onViewDetails });

    list.props.children[0].props.onViewDetails();
    expect(onViewDetails).toHaveBeenCalledWith(UNIT);
  });
});
