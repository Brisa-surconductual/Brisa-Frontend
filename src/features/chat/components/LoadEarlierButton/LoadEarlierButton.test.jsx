import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { LoadEarlierButton } from './LoadEarlierButton.jsx';

const render = (props) =>
  renderToStaticMarkup(<LoadEarlierButton onCargar={() => {}} {...props} />);

describe('LoadEarlierButton (RF-32)', () => {
  it('ofrece ver mensajes anteriores con ícono y sin emoji', () => {
    const html = render({ cargando: false, error: null });

    expect(html).toContain('Ver mensajes anteriores');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('<svg');
  });

  it('mientras carga se deshabilita y lo anuncia', () => {
    const html = render({ cargando: true, error: null });

    expect(html).toContain('Cargando mensajes anteriores');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it('muestra el mensaje del backend tal cual cuando falla', () => {
    const html = render({
      cargando: false,
      error: {
        status: 500,
        codigo: 'CONTENIDO_NO_DISPONIBLE',
        mensaje: 'El contenido del nodo no está disponible.',
        reintentable: true,
      },
    });

    expect(html).toContain('El contenido del nodo no está disponible.');
    expect(html).toContain('aria-live="polite"');
  });

  it('usa solo tokens de diseño (sin colores hardcodeados)', () => {
    const html = render({ cargando: false, error: null });

    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i);
  });
});
