import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScheduleActivationDialog } from './ScheduleActivationDialog.jsx';
const render = (props) =>
  renderToStaticMarkup(<ScheduleActivationDialog open {...props} />);
describe('Confirmación de activación', () => {
  it('explica reemplazo del base y conservación de participantes', () => {
    const html = render({ isBase: true, scheduleName: 'Base nuevo' });
    expect(html).toContain('Base nuevo');
    expect(html).toContain('participantes actuales conservarán');
    expect(html).not.toContain('disabled=""');
  });
  it('conserva el error para poder corregir y reintentar', () => {
    const html = render({ error: 'Falta contenido programado' });
    expect(html).toContain('role="alert"');
    expect(html).toContain('Falta contenido programado');
  });
  it('bloquea ambas acciones durante la activación', () => {
    const html = render({ isSubmitting: true });
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain('aria-busy="true"');
  });
});
