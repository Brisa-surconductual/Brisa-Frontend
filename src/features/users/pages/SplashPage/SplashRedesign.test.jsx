import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { SplashPage } from './SplashPage.jsx';

const state = vi.hoisted(() => ({ value: null }));

vi.mock('./hooks/useSplashPage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useSplashPage: () => state.value ?? actual.useSplashPage() };
});

const render = () => renderToStaticMarkup(<MemoryRouter><SplashPage /></MemoryRouter>);

describe('Splash (CP-01)', () => {
  it('tiene un único <main> con un solo h1', () => {
    state.value = null;
    const html = render();

    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('al abrir la instalación muestra la hoja y deja inerte el contenido', () => {
    state.value = {
      install: { modo: 'manual', plataforma: 'ios' },
      isInstallOpen: true,
      openInstall: vi.fn(),
      closeInstall: vi.fn(),
      footer: 'v1.0.0 · Universidad Surcolombiana',
    };
    const html = render();

    expect(html).toMatch(/<main inert=""/);
    expect(html).toContain('role="dialog"');
    expect(html).toMatch(/href="\/registro\/cuenta"/);
    expect(html).toMatch(/href="\/login"/);
  });
});
