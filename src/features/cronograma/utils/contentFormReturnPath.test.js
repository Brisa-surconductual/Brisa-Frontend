import { describe, expect, it } from 'vitest';
import { contentFormReturnPath } from './contentFormReturnPath.js';
describe('Regreso después de crear contenido', () => {
  it('regresa a la asociación de la misma unidad usando la ruta del router', () => {
    expect(
      contentFormReturnPath({ scheduleId: 'cronograma', unitId: 'unidad' }),
    ).toBe(
      '/app/administrativo/cronograma/cronograma/unidades/unidad/contenido',
    );
  });
  it('conserva el regreso al catálogo para edición y creación independiente', () => {
    expect(contentFormReturnPath()).toBe(
      '/app/administrativo/cronograma/contenidos',
    );
    expect(
      contentFormReturnPath(
        { scheduleId: 'cronograma', unitId: 'unidad' },
        true,
      ),
    ).toBe('/app/administrativo/cronograma/contenidos');
  });
});
