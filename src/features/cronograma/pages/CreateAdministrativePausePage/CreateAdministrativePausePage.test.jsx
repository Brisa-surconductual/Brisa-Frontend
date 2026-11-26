import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { findAll, hookStub, renderDirect } from '../../test-utils/directRender.js';
import { AdministrativePauseForm } from '../../components/AdministrativePauseForm/AdministrativePauseForm.jsx';
import { CreateAdministrativePausePage } from './CreateAdministrativePausePage.jsx';
import { useCreateAdministrativePauseForm } from './hooks/useCreateAdministrativePauseForm.js';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), registrar: vi.fn(), formOptions: null }));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../api/pausasAdministrativas/registerAdministartiveBreak.jsx', () => ({
  registerAdministrativeBreak: (...args) => mocks.registrar(...args),
}));

vi.mock('./hooks/useCreateAdministrativePauseForm.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCreateAdministrativePauseForm: (options) => {
      mocks.formOptions = options;
      return actual.useCreateAdministrativePauseForm(options);
    },
  };
});

const VALUES = Object.freeze({
  participantId: 'u-qa',
  startDate: '2026-11-10',
  endDate: '2026-11-17',
  reason: 'Motivo QA',
});
const EMPTY = Object.freeze({ participantId: '', startDate: '', endDate: '', reason: '' });

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.registrar.mockReset();
});

describe('Registrar pausa administrativa', () => {
  it('CP-12 conserva los campos exactos con etiquetas asociadas', () => {
    const html = renderToStaticMarkup(<AdministrativePauseForm form={EMPTY} onChange={() => {}} />);

    expect(html).toMatch(/<label for="assign-participant"/);
    expect(html).toMatch(/<label[^>]*for="pauseStartDate"/);
    expect(html).toMatch(/<label[^>]*for="pauseEndDate"/);
    expect(html).toMatch(/<label[^>]*for="pauseReason"/);
    expect(html.match(/<input|<textarea/g)).toHaveLength(4);
  });

  it('CP-12 conserva las validaciones y no envía con errores', () => {
    const onValidSubmit = vi.fn();
    const { handleSubmit } = renderDirect(() => useCreateAdministrativePauseForm({ onValidSubmit }));

    handleSubmit({ preventDefault: vi.fn() });
    expect(hookStub.setters[1]).toHaveBeenCalledWith({
      participantId: 'Debes seleccionar un participante.',
      startDate: 'La fecha de inicio es obligatoria.',
      endDate: 'La fecha de fin es obligatoria.',
      reason: 'El motivo de la pausa es obligatorio.',
    });

    const invertidas = renderDirect(
      () => useCreateAdministrativePauseForm({ onValidSubmit }),
      { 0: { ...VALUES, startDate: '2026-11-17', endDate: '2026-11-10' } },
    );
    invertidas.handleSubmit({ preventDefault: vi.fn() });
    expect(hookStub.setters[1]).toHaveBeenCalledWith({
      endDate: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
    });
    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it('CP-12 los errores quedan ligados a su campo', () => {
    const html = renderToStaticMarkup(
      <AdministrativePauseForm
        form={EMPTY}
        errors={{ participantId: 'Debes seleccionar un participante.', reason: 'El motivo de la pausa es obligatorio.' }}
        onChange={() => {}}
      />,
    );

    expect(html).toMatch(/aria-describedby="assign-participant-hint assign-participant-error" aria-invalid="true"/);
    expect(html).toMatch(/id="assign-participant-error"[^>]*role="alert">Debes seleccionar un participante\./);
    expect(html).toMatch(/aria-describedby="administrative-pause-reason-error"/);
  });

  it('CP-12 conserva endpoint, payload y redirección', async () => {
    vi.useFakeTimers();
    mocks.registrar.mockResolvedValue({});
    renderDirect(CreateAdministrativePausePage);

    await mocks.formOptions.onValidSubmit(VALUES);
    vi.advanceTimersByTime(1500);
    vi.useRealTimers();

    expect(mocks.registrar).toHaveBeenCalledWith('u-qa', {
      fecha_inicio_pausa: '2026-11-10',
      fecha_fin_pausa: '2026-11-17',
      motivo_pausa: 'Motivo QA',
    });
    expect(hookStub.setters[1]).toHaveBeenCalledWith('¡Pausa administrativa registrada correctamente!');
    expect(mocks.navigate).toHaveBeenCalledWith('/app/administrativo/cronograma/pausas');
  });

  it('CP-12 el error del servidor se muestra sin redirigir', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.registrar.mockRejectedValue({ response: { status: 400, data: { message: ['Fechas solapadas.'] } } });
    renderDirect(CreateAdministrativePausePage);

    await mocks.formOptions.onValidSubmit(VALUES);

    expect(hookStub.setters[0]).toHaveBeenCalledWith('Fechas solapadas.');
    expect(mocks.navigate).not.toHaveBeenCalled();
    console.error.mockRestore();
  });

  it('tras registrar, el envío queda bloqueado mientras redirige', () => {
    const tree = renderDirect(CreateAdministrativePausePage, { 1: 'Registrada.' });
    const [form] = findAll(tree, (el) => el.type === AdministrativePauseForm);

    expect(form.props.submitDisabled).toBe(true);
    expect(renderToStaticMarkup(tree)).toMatch(/role="status"[\s\S]*Registrada\./);
  });

  it('privacidad: ningún console.log expone participante o motivo', () => {
    const files = [
      './CreateAdministrativePausePage.jsx',
      '../../components/AdministrativePauseForm/AdministrativePauseForm.jsx',
      '../AdministrativePauseHistoryPage/AdministrativePauseHistoryPage.jsx',
    ].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

    for (const source of files) {
      expect(source).not.toMatch(/console\.log/);
      // Los console.error existentes solo registran el estado HTTP.
      expect(source).not.toMatch(/console\.error\([^)]*(motivo|reason|idUsuario|payload)/);
    }
  });

  it('CP-18 un solo h1 y sin <main>', () => {
    const html = renderToStaticMarkup(renderDirect(CreateAdministrativePausePage));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});
