import { describe, expect, it } from 'vitest';
import { validateAssociateContentForm } from './associateContentFormValidation.js';
const unit = {
  startDate: '2026-10-20T00:00:00Z',
  endDate: '2026-10-23T00:00:00Z',
};
const local = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const form = {
  contentId: 'contenido',
  availableFrom: local('2026-10-20T12:00:00Z'),
  availableUntil: local('2026-10-21T12:00:00Z'),
};
describe('Rango de disponibilidad contra los instantes reales de la unidad', () => {
  it('acepta una ventana dentro de la unidad', () =>
    expect(validateAssociateContentForm(form, unit)).toEqual({}));
  it('rechaza un fin posterior al límite UTC aunque sea el mismo día del calendario local', () =>
    expect(
      validateAssociateContentForm(
        { ...form, availableUntil: local('2026-10-23T05:00:00Z') },
        unit,
      ).availableUntil,
    ).toContain('fin de la unidad'));
  it('acepta exactamente los límites de la unidad', () =>
    expect(
      validateAssociateContentForm(
        {
          ...form,
          availableFrom: local(unit.startDate),
          availableUntil: local(unit.endDate),
        },
        unit,
      ),
    ).toEqual({}));
  it('rechaza inicio anterior', () =>
    expect(
      validateAssociateContentForm(
        { ...form, availableFrom: local('2026-10-19T23:00:00Z') },
        unit,
      ).availableFrom,
    ).toContain('anterior'));
});
