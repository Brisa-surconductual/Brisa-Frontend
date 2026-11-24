import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { SOS_PATH } from '../../types/sos.js';

import { abrirSos } from './abrirSos.js';
import { SosButton } from './SosButton.jsx';
import { SOS_BUTTON_HINT, SOS_BUTTON_HINT_ID } from './sosButtonStyles.js';

const render = (path) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <SosButton />
    </MemoryRouter>,
  );

describe('SosButton (RF-43)', () => {
  it('botón real con texto visible como nombre accesible, ícono oculto y ayuda de movimiento', () => {
    const html = render('/app/estudiante');
    const boton = html.match(/<button[^>]*>[\s\S]*?<\/button>/)[0];

    expect(boton).toMatch(/^<button type="button"/);
    expect(boton).toContain(
      '<span class="max-[339px]:sr-only">Tengo ganas de vapear</span>',
    );
    expect(boton).toContain('aria-hidden="true"');
    expect(boton).toContain(`aria-describedby="${SOS_BUTTON_HINT_ID}"`);
    expect(html).toContain(
      `<span id="${SOS_BUTTON_HINT_ID}" class="sr-only">${SOS_BUTTON_HINT}</span>`,
    );
    expect(boton).not.toContain('disabled=""');
    expect(boton).toContain('data-arrastrando="false"');
    // Sin mover, la posición la da el CSS (no hay estilo en línea).
    expect(boton).not.toContain('style=');
  });

  it('rojo propio del SOS con estados hover, active, foco y deshabilitado', () => {
    const html = render('/app/estudiante');

    expect(html).toContain('bg-[var(--sos-bg)]');
    expect(html).toContain('text-[var(--sos-text)]');
    expect(html).toContain('enabled:hover:bg-[var(--sos-bg-hover)]');
    expect(html).toContain('enabled:active:bg-[var(--sos-bg-active)]');
    expect(html).toContain('focus-visible:outline-[var(--sos-focus-ring)]');
    expect(html).toContain('disabled:bg-[var(--sos-bg-disabled)]');
    // No usa los colores de los demás botones.
    expect(html).not.toContain('--brand-');
    expect(html).not.toContain('--button-primary-text');
  });

  it('arrastrable: sin desplazamiento de la página al arrastrar y toque mínimo de 48 px', () => {
    const html = render('/app/estudiante');

    expect(html).toContain('touch-none');
    expect(html).toContain('min-h-[48px]');
    expect(html).toContain('min-w-[48px]');
    expect(html).toContain('data-[arrastrando=true]:cursor-grabbing');
  });

  it('móvil: sobre la barra inferior y su área segura; escritorio: en la esquina', () => {
    const html = render('/app/estudiante');

    expect(html).toContain(
      'bottom-[calc(64px+env(safe-area-inset-bottom)+var(--space-3))]',
    );
    expect(html).toContain('md:bottom-[var(--space-6)]');
  });

  it('no se muestra dentro de la intervención SOS', () => {
    expect(render(SOS_PATH)).toBe('');
  });
});

describe('abrirSos: un toque, sin confirmación', () => {
  const reloj = { mono: () => 123 };

  it('inicia la activación con el contexto de origen y abre la pantalla SOS', () => {
    const solicitar = vi.fn();
    const navigate = vi.fn();

    abrirSos({
      location: { pathname: '/app/estudiante/chat/sesion/s1', search: '' },
      navigate,
      solicitar,
      reloj,
    });

    expect(solicitar).toHaveBeenCalledTimes(1);
    expect(solicitar).toHaveBeenCalledWith({
      contexto: {
        modulo: 'CHAT',
        ruta: '/app/estudiante/chat/sesion/s1',
        estado: null,
      },
      toque: 123,
    });
    expect(navigate).toHaveBeenCalledWith(SOS_PATH);
    // La activación sale antes de navegar (en el mismo evento del toque).
    expect(solicitar.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });

  it('desde la propia pantalla SOS no inicia otra intervención', () => {
    const solicitar = vi.fn();
    const navigate = vi.fn();

    abrirSos({ location: { pathname: SOS_PATH }, navigate, solicitar, reloj });

    expect(solicitar).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
