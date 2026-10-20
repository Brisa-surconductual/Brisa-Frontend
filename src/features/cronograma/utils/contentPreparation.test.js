import { describe, expect, it } from 'vitest';
import { mapCatalogContent, resourcesAreReady } from './contentPreparation.js';
describe('Preparación y permisos de contenido', () => {
  it('respeta el bloqueo del servidor aunque el contenido tenga recursos', () => {
    const item = mapCatalogContent({
      idContenido: 'contenido',
      editable: false,
      listoParaProgramar: true,
      estadoCronograma: 'ACTIVO',
    });
    expect(item.canEdit).toBe(false);
    expect(item.canDelete).toBe(false);
    expect(item.resourcesReady).toBe(true);
  });
  it('impide finalizar con cero recursos o módulos no activos', () => {
    expect(resourcesAreReady([], [{ id: 'CHAT' }])).toBe(false);
    expect(
      resourcesAreReady([{ moduleIds: ['inactivo'] }], [{ id: 'CHAT' }]),
    ).toBe(false);
  });
  it('exige al menos un destino activo para cada bloque', () => {
    expect(
      resourcesAreReady(
        [{ moduleIds: ['CHAT'] }, { moduleIds: [] }],
        [{ id: 'CHAT' }],
      ),
    ).toBe(false);
    expect(resourcesAreReady([{ moduleIds: ['CHAT'] }], [{ id: 'CHAT' }])).toBe(
      true,
    );
  });
});
