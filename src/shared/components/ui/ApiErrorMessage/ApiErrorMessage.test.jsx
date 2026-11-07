import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ApiErrorMessage } from './index.js';

const render = (props) => renderToStaticMarkup(<ApiErrorMessage {...props} />);
const onRetry = () => {};

describe('ApiErrorMessage', () => {
  it('muestra el mensaje del backend tal cual', () => {
    const html = render({
      error: { codigo: 'REQUERIDO', mensaje: 'Este campo es obligatorio.' },
    });

    expect(html).toContain('>Este campo es obligatorio.<');
  });

  it('ofrece reintentar con un 500 y no con un 400', () => {
    const con500 = render({
      error: { status: 500, mensaje: 'Falla', reintentable: true },
      onRetry,
    });
    const con400 = render({
      error: { status: 400, mensaje: 'Inválido', reintentable: false },
      onRetry,
    });

    expect(con500).toContain('Reintentar');
    expect(con400).not.toContain('Reintentar');
  });

  it('usa el texto propio cuando no hay mensaje y no hubo conexión', () => {
    const html = render({ error: { codigo: 'SIN_CONEXION', mensaje: '' } });

    expect(html).toContain(
      'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    );
  });
});
