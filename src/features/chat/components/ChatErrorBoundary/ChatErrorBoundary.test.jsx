import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { registrarErrorCliente } from '../../services/erroresCliente.js';

import { ChatErrorBoundary } from './ChatErrorBoundary.jsx';

vi.mock('../../services/erroresCliente.js', async (original) => ({
  ...(await original()),
  registrarErrorCliente: vi.fn().mockResolvedValue(false),
}));

const ID = '37000000-0000-4000-8000-000000000001';

// renderToStaticMarkup no ejecuta límites de error: se prueba el ciclo de
// la clase directamente.
function conFallo(props = {}) {
  const limite = new ChatErrorBoundary({
    idSesion: ID,
    onVolverAlChat: () => {},
    children: <p>Conversación</p>,
    ...props,
  });
  limite.state = {
    ...limite.state,
    ...ChatErrorBoundary.getDerivedStateFromError(new Error('x')),
  };
  return limite;
}

describe('ChatErrorBoundary (RF-37)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin error presenta la conversación', () => {
    const limite = new ChatErrorBoundary({ children: <p>Conversación</p> });

    expect(renderToStaticMarkup(limite.render())).toBe('<p>Conversación</p>');
  });

  it('un error de presentación muestra un aviso comprensible y sin detalles', () => {
    const html = renderToStaticMarkup(conFallo().render());

    expect(html).toContain('role="alert"');
    expect(html).toContain('Ocurrió un error inesperado. Inténtalo de nuevo.');
    expect(html).toContain('Tus respuestas guardadas no se perdieron.');
    expect(html).toContain('Reintentar');
    expect(html).toContain('Volver al chat');
    expect(html).not.toContain('Conversación');
    expect(html).not.toMatch(/at |stack|\.jsx?:/);
  });

  it('reporta ERROR_PRESENTACION solo con el código y la sesión', () => {
    const error = new Error('fallo con dato sensible');
    error.stack = 'Error: fallo\n    at Componente (src/x.jsx:1:1)';

    conFallo().componentDidCatch(error, { componentStack: 'en <Hilo>' });

    expect(registrarErrorCliente).toHaveBeenCalledTimes(1);
    expect(registrarErrorCliente).toHaveBeenCalledWith({
      codigo: 'ERROR_PRESENTACION',
      idSesion: ID,
    });
  });

  it('si el reporte falla, el aviso se sigue mostrando', () => {
    registrarErrorCliente.mockRejectedValueOnce(new Error('sin red'));
    const limite = conFallo();

    expect(() => limite.componentDidCatch(new Error('x'))).not.toThrow();
    expect(renderToStaticMarkup(limite.render())).toContain('Reintentar');
  });

  it('«Reintentar» vuelve a montar la conversación', () => {
    const limite = conFallo();
    limite.setState = (actualizar) => {
      limite.state = { ...limite.state, ...actualizar(limite.state) };
    };

    limite.recuperar();

    expect(limite.state).toEqual({ fallo: false, intento: 1 });
    expect(renderToStaticMarkup(limite.render())).toBe('<p>Conversación</p>');
  });
});
