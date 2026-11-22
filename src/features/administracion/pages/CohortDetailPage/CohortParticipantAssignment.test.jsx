import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { DEMO_PARTICIPANTS } from '../../data/participantDemoData.js';
import { countParticipantsByStatus } from '../../services/participantSummary.js';
import { CohortDetailPage } from './CohortDetailPage.jsx';

const detail = vi.hoisted(() => ({ value: null }));
const assignment = vi.hoisted(() => ({ value: null, args: null }));
const removal = vi.hoisted(() => ({ dismissNotice: vi.fn() }));

vi.mock('./hooks/useCohortDetail.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCohortDetail: (args) => detail.value ?? actual.useCohortDetail(args) };
});

vi.mock('./hooks/useParticipantAssignment.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantAssignment: (args) => {
      assignment.args = args;
      return assignment.value ?? actual.useParticipantAssignment(args);
    },
  };
});

// El retiro real, con su descarte de avisos observable.
vi.mock('./hooks/useParticipantRemoval.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantRemoval: (args) => ({ ...actual.useParticipantRemoval(args), dismissNotice: removal.dismissNotice }),
  };
});

const COHORT_B = DEMO_COHORTS[1];
const PARTICIPANTS_B = DEMO_PARTICIPANTS.filter(({ cohortId }) => cohortId === COHORT_B.id);

const DETAIL = Object.freeze({
  cohort: COHORT_B,
  participants: PARTICIPANTS_B,
  participationCounts: countParticipantsByStatus(PARTICIPANTS_B),
  isLoading: false,
  loadError: '',
  notFound: false,
  participantsError: '',
  isDemo: true,
  isIntegrationPending: false,
  canManage: true,
  retry: vi.fn(),
  addParticipants: vi.fn(),
});

const ASSIGNMENT = Object.freeze({
  canAssign: true,
  isOpen: false,
  available: [],
  unavailable: [],
  isLoadingCandidates: false,
  catalogError: '',
  selected: [],
  selectionError: '',
  conflicts: [],
  requestError: '',
  isSubmitting: false,
  result: null,
  headingRef: { current: null },
  resultRef: { current: null },
  triggerRef: { current: null },
  open: vi.fn(),
  cancel: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
  submit: vi.fn(),
  retryCatalog: vi.fn(),
  dismissResult: vi.fn(),
});

const CANDIDATES = Object.freeze([
  Object.freeze({ id: 'demo-candidato-9', code: 'PART-0009', issue: null }),
  Object.freeze({ id: 'demo-candidato-10', code: 'PART-0010', issue: null }),
]);
const UNAVAILABLE = Object.freeze([
  Object.freeze({ id: 'demo-candidato-13', code: 'PART-0013', issue: 'NO_DISPONIBLE', message: 'El participante no está disponible para asignación.' }),
]);

function render({ detailChanges = {}, assignmentChanges = {} } = {}) {
  detail.value = { ...DETAIL, ...detailChanges };
  assignment.value = { ...ASSIGNMENT, ...assignmentChanges };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/app/administrativo/cohortes/${COHORT_B.id}`]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte" element={<CohortDetailPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, '');
const openPanel = (changes = {}) =>
  render({ assignmentChanges: { isOpen: true, available: CANDIDATES, unavailable: UNAVAILABLE, ...changes } });

afterEach(() => {
  detail.value = null;
  assignment.value = null;
  assignment.args = null;
});

describe('Acceso a la asignación (RF-125)', () => {
  it('en demostración ofrece «Asignar participantes» y pasa la cohorte de la ruta', () => {
    const html = render();

    expect(html).toMatch(/<button[^>]*>.*Asignar participantes<\/button>/);
    expect(assignment.args).toMatchObject({ cohortId: COHORT_B.id, enabled: true });
  });

  // E10: un aviso de retiro anterior no convive con el resultado nuevo.
  it('al asignar refleja a los asignados y retira el aviso de un retiro anterior', () => {
    const assigned = [{ id: 'demo-candidato-9', code: 'PART-0009' }];
    render();
    assignment.args.onAssigned(assigned);

    expect(DETAIL.addParticipants).toHaveBeenCalledWith(assigned);
    expect(removal.dismissNotice).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['sin modo demo', { canManage: false }],
    ['si falló la lista de participantes', { participantsError: 'No pudimos cargar los participantes.' }],
    ['mientras carga', { isLoading: true }],
  ])('%s no habilita la asignación', (_, detailChanges) => {
    render({ detailChanges, assignmentChanges: { canAssign: false } });

    expect(assignment.args.enabled).toBe(false);
  });

  it('sin asignación disponible no hay botón ni panel', () => {
    const html = render({ assignmentChanges: { canAssign: false, isOpen: true } });

    expect(html).not.toContain('Asignar participantes');
  });

  it('integración pendiente: sin acciones funcionales de asignación', () => {
    const html = render({
      detailChanges: { cohort: null, participants: [], isDemo: false, isIntegrationPending: true, canManage: false },
      assignmentChanges: { canAssign: false },
    });

    expect(html).toContain('Integración pendiente');
    expect(html).not.toMatch(/<button|Asignar/);
  });

  it('cohorte vacía: invita a asignar sin decir que no está disponible', () => {
    const html = render({ detailChanges: { cohort: DEMO_COHORTS[0], participants: [], participationCounts: countParticipantsByStatus([]) } });

    expect(textOf(html)).toContain('Usa «Asignar participantes» para incorporarlos.');
    expect(html).not.toContain('todavía no está disponible');
  });

  it('el panel de asignación no mezcla el retiro (E7 vive en cada tarjeta)', () => {
    const html = openPanel();
    const panel = html.slice(html.indexOf('Asignar participantes</h3>'), html.indexOf('</form>'));

    expect(textOf(panel)).not.toMatch(/Retirar|Eliminar participante/);
  });
});

describe('Panel de asignación', () => {
  it('al abrirse reemplaza al botón y lista los disponibles por código con casillas', () => {
    const html = openPanel();

    expect(html).toMatch(/<h3[^>]*tabindex="-1"[^>]*>.*Asignar participantes<\/h3>/);
    expect(html).not.toMatch(/<button[^>]*>[^<]*<svg[^>]*>.*?Asignar participantes<\/button>/);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(textOf(html)).toContain('Participantes disponibles (2)');
    expect(html).toContain('PART-0009');
    expect(html).toContain('PART-0010');
  });

  it('muestra los no disponibles con el motivo que informó la fuente, sin casilla', () => {
    const html = openPanel();

    expect(textOf(html)).toMatch(/No disponibles para esta cohorte.*PART-0013.*El participante no está disponible para asignación\./);
  });

  it('marca la selección, cuenta los seleccionados y permite quitarlos', () => {
    const html = openPanel({
      selected: [
        { id: 'demo-candidato-9', code: 'PART-0009', hasIssue: false },
        { id: 'demo-candidato-10', code: 'PART-0010', hasIssue: false },
      ],
    });

    expect(html.match(/type="checkbox"[^>]*checked=""/g)).toHaveLength(2);
    expect(textOf(html)).toContain('2 participantes seleccionados');
    expect(html).toContain('aria-label="Quitar PART-0009 de la selección"');
    expect(html).toContain('aria-label="Quitar PART-0010 de la selección"');
    expect(textOf(html)).toContain('Confirmar asignación (2)');
  });

  it('sin selección lo indica; el error de selección es una alerta asociada al grupo', () => {
    const html = openPanel({ selectionError: 'Selecciona al menos un participante para asignar.' });

    expect(textOf(html)).toContain('Ningún participante seleccionado');
    expect(html).toMatch(/<fieldset[^>]*aria-describedby="([^"]+)"[\s\S]*id="\1" role="alert"[\s\S]*Selecciona al menos un participante/);
  });

  it('conflictos: alerta con cada código y su motivo; el seleccionado en conflicto se marca', () => {
    const html = openPanel({
      selected: [{ id: 'demo-candidato-9', code: 'PART-0009', hasIssue: true }],
      requestError: 'No se asignó ningún participante porque algunos no pueden incorporarse. Quítalos de la selección e inténtalo de nuevo.',
      conflicts: [
        { participantId: 'demo-candidato-9', code: 'PART-0009', message: 'El participante pertenece a otra cohorte activa.' },
        { participantId: 'demo-candidato-14', code: 'PART-0014', message: 'El participante seleccionado no existe.' },
      ],
    });
    const text = textOf(html);

    expect(html).toMatch(/role="alert"[\s\S]*No se asignaron participantes/);
    expect(text).toContain('PART-0009: El participante pertenece a otra cohorte activa.');
    expect(text).toContain('PART-0014: El participante seleccionado no existe.');
    expect(text).toContain('PART-0009 (no puede asignarse)');
  });

  it('error de almacenamiento: alerta sin conflictos', () => {
    const html = openPanel({ requestError: 'No fue posible actualizar la lista de participantes de la cohorte. No se asignó ningún participante.' });

    expect(textOf(html)).toContain('No fue posible actualizar la lista de participantes de la cohorte.');
  });

  it('durante el envío bloquea casillas, quitar, cancelar y confirmar', () => {
    const html = openPanel({ isSubmitting: true, selected: [{ id: 'demo-candidato-9', code: 'PART-0009', hasIssue: false }] });

    expect(html).toContain('Asignando...');
    expect(html.match(/type="checkbox"[^>]*disabled=""/g)).toHaveLength(2);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Quitar PART-0009/);
    expect(html).toMatch(/<button type="button"[^>]*disabled=""[^>]*>Cancelar<\/button>/);
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""[^>]*aria-busy="true"/);
  });

  it('recuerda que los cambios son temporales y ofrece Cancelar', () => {
    const html = openPanel();

    expect(textOf(html)).toContain('Los cambios son temporales y no se guardan en el servidor.');
    expect(html).toMatch(/<button type="button"[^>]*>Cancelar<\/button>/);
  });

  it('carga y error del catálogo', () => {
    const loading = openPanel({ isLoadingCandidates: true, available: [], unavailable: [] });
    const failed = openPanel({ catalogError: 'No pudimos cargar los participantes disponibles. Intenta nuevamente.' });

    expect(loading).toMatch(/role="status"[^>]*>Cargando participantes disponibles/);
    expect(loading).not.toContain('type="checkbox"');
    expect(failed).toMatch(/role="alert"[\s\S]*Participantes disponibles no cargados[\s\S]*Reintentar/);
    expect(failed).not.toContain('type="checkbox"');
  });

  it('catálogo vacío: lo dice', () => {
    expect(textOf(openPanel({ available: [], unavailable: [] }))).toContain('No hay participantes disponibles para esta cohorte.');
  });

  it('nunca muestra datos personales ni identificadores internos', () => {
    const html = openPanel({
      available: [{ id: 'id-interno-secreto', code: 'PART-0009', issue: null, correoElectronico: 'persona@example.com', nombre: 'Nombre Apellido', documento: '123456789' }],
      unavailable: [],
    });

    for (const value of ['id-interno-secreto', 'demo-candidato', 'persona@example.com', 'Nombre Apellido', '123456789']) {
      expect(html).not.toContain(value);
    }
  });
});

describe('Resultado de la asignación', () => {
  const assigned = [
    { id: 'demo-candidato-9', cohortId: COHORT_B.id, code: 'PART-0009', participationStatus: 'ACTIVO', pendingReasons: [] },
    { id: 'demo-candidato-10', cohortId: COHORT_B.id, code: 'PART-0010', participationStatus: 'PENDIENTE_VALIDACION', pendingReasons: ['Línea base no registrada.'] },
  ];

  it('muestra cada participante con el estado y los motivos recibidos, como aviso enfocable', () => {
    const html = render({ assignmentChanges: { result: assigned } });
    const text = textOf(html);

    expect(html).toMatch(/tabindex="-1" role="status"[\s\S]*Participantes asignados temporalmente/);
    expect(text).toContain('2 participantes se incorporaron con el estado que informó la fuente de demostración.');
    expect(text).toMatch(/PART-0009Estado en la cohorte: Activo/);
    expect(text).toMatch(/PART-0010Estado en la cohorte: Pendiente de validación/);
    expect(text).toContain('Motivos de validación pendiente: Línea base no registrada.');
    expect(text).toContain('Los cambios son temporales y no se guardan en el servidor.');
    expect(html).toContain('aria-label="Cerrar aviso de asignación"');
    expect(text).not.toMatch(/registrad[oa]s? definitivamente|guardad[oa]s? en el servidor\./);
  });

  it('el listado y los contadores reflejan a los asignados', () => {
    const participants = [...PARTICIPANTS_B, ...assigned];
    const html = render({
      detailChanges: { participants, participationCounts: countParticipantsByStatus(participants) },
      assignmentChanges: { result: assigned },
    });

    expect(html.match(/<article/g)).toHaveLength(24);
    expect(textOf(html)).toContain('24 participantes · 19 activos · 4 pendientes de validación · 1 inactivo');
  });
});
