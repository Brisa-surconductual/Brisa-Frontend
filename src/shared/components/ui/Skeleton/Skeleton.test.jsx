import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { LoadingRegion, SkeletonText } from './index.js';

describe('SkeletonText', () => {
  it('pinta las líneas pedidas y la última más corta', () => {
    const html = renderToStaticMarkup(<SkeletonText lines={3} />);
    const widths = [...html.matchAll(/style="width:([^;]+);/g)].map(
      ([, w]) => w,
    );

    expect(widths).toEqual(['100%', '100%', '60%']);
  });
});

describe('LoadingRegion', () => {
  it('con loading se anuncia con el label', () => {
    const html = renderToStaticMarkup(
      <LoadingRegion loading label="Cargando contenido" skeleton={<SkeletonText />}>
        <p>Listo</p>
      </LoadingRegion>,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando contenido');
    expect(html).not.toContain('Listo');
  });

  it('sin loading pinta solo children', () => {
    const html = renderToStaticMarkup(
      <LoadingRegion loading={false} label="Cargando contenido">
        <p>Listo</p>
      </LoadingRegion>,
    );

    expect(html).toBe('<p>Listo</p>');
  });
});
