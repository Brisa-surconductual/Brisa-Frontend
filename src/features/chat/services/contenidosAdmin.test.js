import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ContenidoAsociadoResumen } from '../components/ContenidoAsociadoResumen/ContenidoAsociadoResumen.jsx';
import { ContenidoProgramacion } from '../components/ContenidoProgramacion/ContenidoProgramacion.jsx';
import {
  buscarContenido,
  describirProgramacion,
  mapContenidos,
  opcionesContenido,
  programacionesDe,
} from './contenidosAdmin.js';

// RF-25 / RF-24 · contenido del nodo y dónde está programado.

const catalogo = [
  {
    id_contenido: 'c-1',
    nombre_contenido: 'Manejo del craving',
    tipo_contenido: 'INFORMATIVO',
    programaciones: [
      {
        id_contenido_cronograma: 'cc-a',
        cronograma: {
          id_cronograma: 'cr-a',
          nombre_cronograma: 'Cronograma A',
          estado: 'ACTIVO',
        },
        unidad: {
          id_unidad_temporal: 'u-2',
          orden_unidad: 2,
          nombre_unidad: 'Semana 2',
          fecha_inicio: '2026-12-01',
          fecha_fin: '2026-12-07',
        },
        fecha_inicio_disponibilidad: '2026-12-01T13:00:00.000Z',
        fecha_fin_disponibilidad: '2026-12-07T23:00:00.000Z',
      },
      {
        id_contenido_cronograma: 'cc-b',
        cronograma: {
          id_cronograma: 'cr-b',
          nombre_cronograma: 'Cronograma B',
          estado: 'INACTIVO',
        },
        unidad: {
          id_unidad_temporal: 'u-3',
          orden_unidad: 3,
          nombre_unidad: 'Semana 3',
          fecha_inicio: '2026-12-15',
          fecha_fin: '2026-12-21',
        },
        fecha_inicio_disponibilidad: null,
        fecha_fin_disponibilidad: null,
      },
    ],
  },
  {
    id_contenido: 'c-2',
    nombre_contenido: 'Sin programar',
    tipo_contenido: 'INFORMATIVO',
    programaciones: [],
  },
];

describe('contenidosAdmin', () => {
  const contenidos = mapContenidos(catalogo);

  it('mapea el catálogo y busca por contenido', () => {
    expect(contenidos).toHaveLength(2);
    expect(buscarContenido('c-1', contenidos)?.nombre).toBe(
      'Manejo del craving',
    );
    expect(programacionesDe('c-1', contenidos)).toHaveLength(2);
    expect(programacionesDe('x', contenidos)).toEqual([]);
    expect(mapContenidos(undefined)).toEqual([]);
  });

  it('las opciones dicen en cuántos cronogramas está el contenido', () => {
    expect(opcionesContenido(contenidos)).toEqual([
      { value: 'c-1', label: 'Manejo del craving · en 2 cronogramas' },
      { value: 'c-2', label: 'Sin programar · sin programar' },
    ]);
  });

  it('describe cronograma, unidad y fechas sin correr el día', () => {
    const d = describirProgramacion(programacionesDe('c-1', contenidos)[0]);

    expect(d.cronograma).toBe('Cronograma A (activo)');
    expect(d.unidad).toBe('Unidad 2 · Semana 2');
    // 2026-12-01 es fecha de plantilla: debe seguir siendo el 1, no el 30 nov.
    expect(d.fechas).toMatch(/^1 de dic/);
    expect(d.fechas).toMatch(/7 de dic/);
    expect(d.disponibilidad).toMatch(/^Disponible: /);
  });

  it('sin disponibilidad definida no muestra esa línea', () => {
    const d = describirProgramacion(programacionesDe('c-1', contenidos)[1]);
    expect(d.cronograma).toBe('Cronograma B (inactivo)');
    expect(d.disponibilidad).toBe('');
  });
});

describe('ContenidoProgramacion', () => {
  const contenidos = mapContenidos(catalogo);
  const html = (props) =>
    renderToStaticMarkup(createElement(ContenidoProgramacion, props));

  it('lista cada cronograma con su unidad y fechas', () => {
    const salida = html({
      programaciones: programacionesDe('c-1', contenidos),
    });

    expect(salida).toContain('Cronograma A (activo)');
    expect(salida).toContain('Unidad 3 · Semana 3');
    expect(salida).toContain('Fechas de la plantilla del cronograma');
  });

  it('avisa si el contenido no está programado en ningún cronograma', () => {
    expect(html({ programaciones: [] })).toContain(
      'no está programado en ningún cronograma',
    );
  });
});

describe('ContenidoAsociadoResumen (tarjeta del nodo)', () => {
  const contenidos = mapContenidos(catalogo);
  const html = (contenido) =>
    renderToStaticMarkup(
      createElement(ContenidoAsociadoResumen, { contenido }),
    );

  it('rotula el contenido, cada cronograma, su unidad temporal y fechas', () => {
    const salida = html(buscarContenido('c-1', contenidos));

    expect(salida).toContain('Contenido asociado');
    expect(salida).toMatch(/Contenido<\/dt>.*Manejo del craving/);
    expect(salida).toMatch(/Cronograma<\/dt>.*Cronograma A \(activo\)/);
    expect(salida).toMatch(/Unidad temporal<\/dt>.*Unidad 2 · Semana 2/);
    expect(salida).toMatch(/Fechas de la unidad<\/dt>.*1 de dic/);
    expect(salida).toContain('Cronograma B (inactivo)');
    expect(salida).toContain('Unidad 3 · Semana 3');
  });

  it('avisa si no está programado o si no está en el catálogo', () => {
    expect(html(buscarContenido('c-2', contenidos))).toContain(
      'No está programado en ningún cronograma',
    );
    expect(html(null)).toContain('No se encontró en el catálogo');
  });
});
