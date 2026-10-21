import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ReconsentPage } from './ReconsentPage.jsx';
import { useReconsentPage } from './hooks/useReconsentPage.js';

vi.mock('./hooks/useReconsentPage.js', () => ({ useReconsentPage: vi.fn() }));

const datos = {
  account: { email: 'registro@example.test' },
  consent: { status: 'NO_VIGENTE' },
  baseline: { age: '2000-01-01' },
  authorizations: {
    personalDataAccepted: false,
    consumptionHistoryAccepted: false,
  },
  sensitiveFieldLabels: ['Fecha de nacimiento'],
  consentIsComplete: false,
  shouldRedirectToReview: false,
  consentData: {
    titulo: 'Documento vigente de prueba',
    urlContenido:
      'Contenido original de la primera línea.\nSegunda línea sin modificar.',
    versionConsetimeinto: '2026-10',
  },
  isLoadingConsent: false,
  loadError: '',
};
const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ReconsentPage />
    </MemoryRouter>,
  );

beforeEach(() => useReconsentPage.mockReturnValue(datos));

describe('pantalla de reconsentimiento', () => {
  it('muestra el título, texto y versión obtenidos del backend, conservando las dos autorizaciones', () => {
    const html = render();
    expect(html).toContain('Documento vigente de prueba');
    expect(html).toContain('Contenido original de la primera línea.');
    expect(html).toContain('Segunda línea sin modificar.');
    expect(html).toContain('Versión 2026-10');
    expect(html).not.toContain('Cargando documento...');
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
  });

  it('bloquea las autorizaciones y el envío mientras carga el documento', () => {
    useReconsentPage.mockReturnValue({
      ...datos,
      consentData: null,
      isLoadingConsent: true,
    });
    const html = render();
    expect(html).toContain('role="status"');
    expect(html).toContain('Cargando consentimiento vigente...');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });

  it('permite reintentar un error de carga sin aceptar un documento ausente', () => {
    useReconsentPage.mockReturnValue({
      ...datos,
      consentData: null,
      loadError: 'No pudimos cargar el consentimiento vigente.',
    });
    const html = render();
    expect(html).toContain('Reintentar carga');
    expect(html).toContain('No pudimos cargar el consentimiento vigente.');
    expect(html).not.toContain('Cargando documento...');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });

  it('muestra un fallo de actualización sin ocultar el documento ni perder las autorizaciones', () => {
    useReconsentPage.mockReturnValue({
      ...datos,
      submitError: 'El consentimiento ya no está vigente.',
      authorizations: {
        personalDataAccepted: true,
        consumptionHistoryAccepted: true,
      },
      consentIsComplete: true,
    });
    const html = render();
    expect(html).toContain('El consentimiento ya no está vigente.');
    expect(html).toContain('Documento vigente de prueba');
    expect(html.match(/checked=""/g)).toHaveLength(2);
  });

  it('bloquea controles y expone el estado ocupado durante la actualización', () => {
    useReconsentPage.mockReturnValue({ ...datos, isSubmitting: true });
    const html = render();
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  });
});
