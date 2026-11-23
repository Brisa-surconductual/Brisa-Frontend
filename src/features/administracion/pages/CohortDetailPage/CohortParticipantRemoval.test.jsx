import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { DEMO_PARTICIPANTS } from '../../data/participantDemoData.js';
import { countParticipantsByStatus } from '../../services/participantSummary.js';
import { CohortDetailPage } from './CohortDetailPage.jsx';

const detail = vi.hoisted(() => ({ value: null }));
const removal = vi.hoisted(() => ({ value: null, args: null }));
const assignment = vi.hoisted(() => ({ dismissResult: vi.fn() }));

vi.mock('./hooks/useCohortDetail.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCohortDetail: (args) => detail.value ?? actual.useCohortDetail(args) };
});

vi.mock('./hooks/useParticipantRemoval.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantRemoval: (args) => {
      removal.args = args;
      return removal.value ?? actual.useParticipantRemoval(args);
    },
  };
});

// La asignación real, con su descarte del resultado observable.
vi.mock('./hooks/useParticipantAssignment.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantAssignment: (args) => ({ ...actual.useParticipantAssignment(args), dismissResult: assignment.dismissResult }),
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
  removeParticipant: vi.fn(),
});

const REMOVAL = Object.freeze({
  canRemove: true,
  busyIds: [],
  notice: null,
  noticeRef: { current: null },
  pendingRemoval: null,
  requestRemoval: vi.fn(),
  cancelRemoval: vi.fn(),
  confirmRemoval: vi.fn(),
  dismissNotice: vi.fn(),
});

function render({ detailChanges = {}, removalChanges = {}, realRemoval = false } = {}) {
  detail.value = { ...DETAIL, ...detailChanges };
  removal.value = realRemoval ? null : { ...REMOVAL, ...removalChanges };
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/app/administrativo/cohortes/${COHORT_B.id}`]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte" element={<CohortDetailPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, '');
const cardOf = (html, code) => {
  const start = html.indexOf(`>${code}</span>`);
  return html.slice(html.lastIndexOf('<article', start), html.indexOf('</article>', start));
};
const dialogOf = (html) => html.slice(html.indexOf('<dialog'), html.indexOf('</dialog>'));

afterEach(() => {
  detail.value = null;
  removal.value = null;
  removal.args = null;
});

describe('Acción «Retirar» (RF-125)', () => {
  it('cada tarjeta ofrece Retirar identificando el código, sin editar ni inactivar', () => {
    const html = render();

    for (const { code } of PARTICIPANTS_B) {
      expect(cardOf(html, code)).toContain(`Retirar<span class="sr-only"> ${code} de la cohorte</span>`);
    }
    expect(textOf(html)).not.toMatch(/Inactivar participante|Editar participante/);
  });

  it('el hook recibe la cohorte, su nombre y las acciones del detalle', () => {
    render();

    expect(removal.args).toMatchObject({
      cohortId: COHORT_B.id,
      cohortName: 'Cohorte Piloto B',
      enabled: true,
      onStale: DETAIL.retry,
    });
    removal.args.onRemoved('demo-participante-1', PARTICIPANTS_B[0]);
    expect(DETAIL.removeParticipant).toHaveBeenCalledWith('demo-participante-1', PARTICIPANTS_B[0]);
    // E10: el resultado de una asignación anterior deja de mostrarse.
    expect(assignment.dismissResult).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['si la gestión no está disponible', { canManage: false }],
    ['si falló la lista', { participantsError: 'No pudimos cargar los participantes.' }],
  ])('%s no se habilita el retiro', (_, detailChanges) => {
    render({ detailChanges, removalChanges: { canRemove: false } });

    expect(removal.args.enabled).toBe(false);
  });

  it('sin gestión (hook real) no hay botón Retirar ni diálogo', () => {
    const html = render({ detailChanges: { canManage: false }, realRemoval: true });

    expect(html).not.toContain('Retirar');
    expect(html).not.toContain('<dialog');
  });

  it('mantiene la tarjeta inactiva sin botón de retiro en el modo API', () => {
    const retired = { ...PARTICIPANTS_B[0], participationStatus: 'INACTIVO' };
    const html = render({ detailChanges: { isDemo: false, participants: [retired, PARTICIPANTS_B[1]] } });

    expect(textOf(cardOf(html, retired.code))).toContain('Inactivo');
    expect(cardOf(html, retired.code)).not.toContain('Retirar');
    expect(cardOf(html, PARTICIPANTS_B[1].code)).toContain('Retirar');
  });

  it('el participante en proceso muestra «Retirando...» y bloquea su botón; los demás siguen igual', () => {
    const html = render({ removalChanges: { busyIds: ['demo-participante-3'] } });

    expect(cardOf(html, 'PART-0003')).toMatch(/<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*>.*Retirando\.\.\./);
    expect(cardOf(html, 'PART-0001')).not.toContain('Retirando...');
  });
});

describe('Confirmación del retiro', () => {
  it('identifica el código y la cohorte, y explica la semántica temporal', () => {
    const html = render({ removalChanges: { pendingRemoval: PARTICIPANTS_B[2] } });
    const dialog = textOf(dialogOf(html));

    expect(dialog).toContain('¿Retirar a «PART-0003» de «Cohorte Piloto B»?');
    expect(dialog).toContain('No se elimina del sistema ni cambian su registro, consentimiento o línea base');
    expect(dialog).toContain('Los cambios son temporales y no se guardan en el servidor.');
    expect(dialog).toContain('Retirar participante');
    expect(dialog).toContain('Cancelar');
  });

  it('el diálogo no muestra datos personales ni identificadores internos', () => {
    const html = render({
      removalChanges: {
        pendingRemoval: { ...PARTICIPANTS_B[0], correoElectronico: 'persona@example.com', nombre: 'Nombre Apellido' },
      },
    });

    for (const value of ['persona@example.com', 'Nombre Apellido', 'demo-participante']) {
      expect(html).not.toContain(value);
    }
  });
});

describe('Resultado del retiro', () => {
  it('éxito: aviso enfocable y temporal; la lista y los contadores reflejan el retiro', () => {
    const remaining = PARTICIPANTS_B.filter(({ code }) => code !== 'PART-0003');
    const html = render({
      detailChanges: { participants: remaining, participationCounts: countParticipantsByStatus(remaining) },
      removalChanges: {
        notice: {
          tone: 'success',
          title: 'Participante retirado temporalmente',
          message: '«PART-0003» ya no forma parte de «Cohorte Piloto B». Los cambios son temporales y no se guardan en el servidor.',
        },
      },
    });

    expect(html).toMatch(/tabindex="-1"[^>]*role="status"[\s\S]*Participante retirado temporalmente/);
    expect(html).not.toContain('>PART-0003</span>');
    expect(html.match(/<article/g)).toHaveLength(21);
    expect(textOf(html)).toContain('21 participantes · 18 activos · 2 pendientes de validación · 1 inactivo');
    expect(cardOf(html, 'PART-0004')).toContain('Registro incompleto.');
  });

  it('error: alerta enfocable sin cambios en la lista', () => {
    const html = render({
      removalChanges: {
        notice: { tone: 'warning', title: 'No se retiró al participante', message: 'El participante ya no pertenece a esta cohorte. Se volvió a consultar el listado.' },
      },
    });

    expect(html).toMatch(/tabindex="-1"[^>]*role="alert"[\s\S]*No se retiró al participante/);
    expect(html.match(/<article/g)).toHaveLength(22);
  });

  it('el aviso se mantiene fuera de la lista, también mientras se vuelve a consultar', () => {
    const html = render({
      detailChanges: { isLoading: true },
      removalChanges: { notice: { tone: 'warning', title: 'No se retiró al participante', message: 'x' } },
    });

    expect(html).toContain('No se retiró al participante');
    expect(html).toContain('aria-busy="true"');
  });

  it('convive con la asignación de E6', () => {
    const html = render();

    expect(html).toMatch(/<button[^>]*>.*Asignar participantes<\/button>/);
  });
});
