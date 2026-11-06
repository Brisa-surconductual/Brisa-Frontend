import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { SessionTimeoutModal } from './SessionTimeoutModal.jsx';

function render(props) {
  return renderToStaticMarkup(
    <SessionTimeoutModal
      open
      remainingMs={60_000}
      onExtend={() => {}}
      onLogout={() => {}}
      {...props}
    />,
  );
}

describe('Aviso de inactividad', () => {
  it('sin confirmación en curso conserva sus dos acciones', () => {
    const html = render();

    expect(html).toContain('Seguir aquí');
    expect(html).toContain('Cerrar sesión');
    expect(html).not.toContain('role="alert"');
  });

  it('mientras confirma con el servidor desactiva "Seguir aquí"', () => {
    const html = render({ isExtending: true });

    expect(html).toContain('Confirmando...');
    expect(html).toContain('aria-busy="true"');
  });

  it('si no se confirma la sesión lo informa y no la da por extendida', () => {
    const html = render({
      extendError: 'No pudimos confirmar tu sesión con el servidor.',
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('No pudimos confirmar tu sesión con el servidor.');
  });
});
