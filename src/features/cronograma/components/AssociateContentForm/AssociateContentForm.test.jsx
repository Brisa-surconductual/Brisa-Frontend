import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AssociateContentForm } from './AssociateContentForm.jsx';
const form = { contentId: '', availableFrom: '', availableUntil: '' };
describe('Asociación sin contenidos libres', () => {
  it('bloquea el formulario y muestra la espera mientras se guarda', () => {
    const html = renderToStaticMarkup(
      <AssociateContentForm
        form={form}
        contentOptions={[{ value: 'contenido', label: 'Contenido' }]}
        isSubmitting
      />,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Asociando contenido...');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  });
  it('permite crear contenido y bloquea la asociación vacía', () => {
    const html = renderToStaticMarkup(
      <AssociateContentForm
        form={form}
        contentHint="Todos los contenidos ya están vinculados."
        onCreateContent={vi.fn()}
      />,
    );
    expect(html).toContain('Crear contenido para esta unidad');
    expect(html).toContain('Todos los contenidos ya están vinculados.');
    expect(html).toMatch(/type="submit"[^>]*disabled=""/);
  });
  it('habilita la asociación cuando existe contenido libre', () => {
    const html = renderToStaticMarkup(
      <AssociateContentForm
        form={form}
        contentOptions={[{ value: 'contenido', label: 'Contenido nuevo' }]}
        onCreateContent={vi.fn()}
      />,
    );
    expect(html).toContain('Contenido nuevo');
    expect(html).not.toContain('Crear contenido para esta unidad');
    expect(html).not.toMatch(/type="submit"[^>]*disabled=""/);
  });
});
