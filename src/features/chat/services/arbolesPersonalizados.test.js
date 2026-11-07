import { describe, expect, it } from 'vitest';

import {
  ACCION_ARBOL,
  accionesDisponibles,
  aplanarVersiones,
  nombreArbolPersonalizado,
} from './arbolesPersonalizados.js';

describe('aplanarVersiones', () => {
  it('junta las versiones de todas las combinaciones', () => {
    const combinaciones = [
      { versiones: [{ id_flujo: 'a' }, { id_flujo: 'b' }] },
      { versiones: [] },
      { versiones: [{ id_flujo: 'c' }] },
    ];

    expect(aplanarVersiones(combinaciones).map((f) => f.id_flujo)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('tolera una combinación sin versiones', () => {
    expect(aplanarVersiones([{}])).toEqual([]);
  });
});

describe('accionesDisponibles', () => {
  it.each([
    [undefined, [ACCION_ARBOL.CREAR]],
    [{ estado: 'BORRADOR' }, [ACCION_ARBOL.PUBLICAR]],
    [
      { estado: 'PUBLICADO' },
      [ACCION_ARBOL.NUEVA_VERSION, ACCION_ARBOL.ARCHIVAR],
    ],
    [{ estado: 'ARCHIVADO' }, [ACCION_ARBOL.NUEVA_VERSION]],
    [{ estado: 'OTRO' }, []],
  ])('según el estado de la última versión (%j)', (tree, esperado) => {
    expect(accionesDisponibles(tree)).toEqual(esperado);
  });

  it('nunca ofrece eliminar', () => {
    for (const tree of [
      undefined,
      { estado: 'BORRADOR' },
      { estado: 'PUBLICADO' },
      { estado: 'ARCHIVADO' },
    ]) {
      expect(accionesDisponibles(tree)).not.toContain('ELIMINAR');
    }
  });
});

describe('nombreArbolPersonalizado', () => {
  it('parte de la etiqueta de la combinación', () => {
    expect(nombreArbolPersonalizado('Tolerancia · Craving positivo')).toBe(
      'Personalizado · Tolerancia · Craving positivo',
    );
  });
});
