import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { SesionCompletada } from './SesionCompletada.jsx';

describe('SesionCompletada (RF-31)', () => {
  const html = renderToStaticMarkup(
    <SesionCompletada
      tituloRef={{ current: null }}
      onVolverInicio={() => {}}
    />,
  );

  it('informa que la sesión terminó y no admite más respuestas', () => {
    expect(html).toContain('¡Has terminado tu terapia!');
    expect(html).toContain('ya no se pueden agregar respuestas');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<input');
  });

  it('el título es enfocable y nombra la región; ofrece volver al inicio', () => {
    expect(html).toContain('aria-labelledby="sesion-completada-titulo"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('Volver al inicio');
  });

  it('usa solo tokens de diseño', () => {
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i);
  });
});
