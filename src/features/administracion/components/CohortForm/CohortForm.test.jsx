import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { CohortForm } from './CohortForm.jsx';

const FORM = Object.freeze({ name: 'Cohorte', startDate: '2026-02-02', endDate: '2026-05-29', scheduleId: 's-1' });
const OPTIONS = Object.freeze([Object.freeze({ value: 's-1', label: 'Cronograma uno' })]);

function render(props = {}) {
  return renderToStaticMarkup(
    <CohortForm
      form={FORM}
      scheduleOptions={OPTIONS}
      submitText="Crear cohorte"
      loadingText="Creando cohorte..."
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />,
  ).replaceAll('<!-- -->', '');
}

describe('Formulario de cohorte', () => {
  it('etiqueta los cuatro campos obligatorios y conserva los valores', () => {
    const html = render();

    for (const [id, label] of [
      ['cohort-name', 'Nombre de la cohorte'],
      ['cohort-start-date', 'Fecha de inicio'],
      ['cohort-end-date', 'Fecha de finalización'],
      ['cohort-schedule', 'Cronograma asociado'],
    ]) {
      expect(html).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>${label}`));
      expect(html).toMatch(new RegExp(`id="${id}"[^>]*required=""|required=""[^>]*id="${id}"`));
    }
    expect(html).toContain('Los campos con * son obligatorios.');
    expect(html).toContain('value="Cohorte"');
    expect(html).toContain('value="2026-02-02"');
    expect(html).toMatch(/<option value="s-1" selected="">Cronograma uno<\/option>/);
    expect(html).toContain('noValidate=""');
  });

  it('muestra cada error junto a su campo y lo asocia por aria-describedby', () => {
    const html = render({
      errors: {
        name: 'El nombre de la cohorte es obligatorio.',
        endDate: 'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.',
        scheduleId: 'Selecciona el cronograma asociado.',
      },
    });

    expect(html).toMatch(/id="cohort-name"[^>]*aria-invalid="true"[^>]*aria-describedby="cohort-name-error"/);
    expect(html).toMatch(/id="cohort-name-error"[^>]*role="alert">El nombre de la cohorte es obligatorio\./);
    expect(html).toMatch(/id="cohort-end-date-error"[^>]*role="alert">La fecha de finalización/);
    expect(html).toMatch(/id="cohort-schedule-error"[^>]*role="alert">Selecciona el cronograma/);
    expect(html).toMatch(/id="cohort-start-date"[^>]*aria-invalid="false"/);
  });

  it('ofrece cancelar y la acción principal, y deshabilita todo al procesar', () => {
    expect(render()).toMatch(/<button type="button"[^>]*>Cancelar<\/button>/);
    expect(render()).toMatch(/<button type="submit"[^>]*>Crear cohorte<\/button>/);

    const busy = render({ isSubmitting: true });
    expect(busy).toContain('<fieldset disabled=""');
    expect(busy).toContain('aria-busy="true"');
    expect(busy).toContain('Creando cohorte...');
  });

  it('sin cronogramas activos lo explica y no permite enviar', () => {
    const html = render({ hasActiveSchedules: false, scheduleOptions: [] });

    expect(html).toMatch(/role="alert"[\s\S]*No hay cronogramas activos/);
    expect(html).not.toContain('id="cohort-schedule"');
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""/);
  });

  it('avisa cuando el cronograma actual ya no está activo', () => {
    expect(render({ replacedSchedule: 'Cronograma antiguo' })).toContain(
      'El cronograma asociado, «Cronograma antiguo», ya no está activo.',
    );
  });

  it('un único h2 con subsecciones h3, sin h1 propio', () => {
    const html = render();

    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html.match(/<h3/g)).toHaveLength(2);
    expect(html).not.toContain('<h1');
  });
});
