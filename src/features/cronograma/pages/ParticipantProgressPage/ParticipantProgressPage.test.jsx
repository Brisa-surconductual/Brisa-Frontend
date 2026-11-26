import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { findAll, hookStub, renderDirect } from '../../test-utils/directRender.js';
import { ParticipantProgressCard } from '../../components/ParticipantProgressCard/ParticipantProgressCard.jsx';
import { ParticipantProgressList } from '../../components/ParticipantProgressList/ParticipantProgressList.jsx';
import { ParticipantProgressPage } from './ParticipantProgressPage.jsx';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), listar: vi.fn() }));

vi.mock('react', async (importOriginal) =>
  (await import('../../test-utils/directRender.js')).mockReact(
    await importOriginal(),
  ));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/features/cronograma/api/contenidoVigente/listarUbicacionesTemporalesParticipantes.jsx', () => ({
  listarUbicacionesTemporalesParticipantes: (...args) => mocks.listar(...args),
}));

const RAW = Object.freeze([
  { id_usuario: 'u-1', correo_electronico: 'uno.qa@example.com', nombre_unidad: 'Semana 2', orden_unidad: 2, id_cronograma_usuario: 'cu-1' },
  { id_usuario: 'u-2', correo_electronico: 'dos.qa@example.com', nombre_unidad: 'Semana 1', orden_unidad: 1, id_cronograma_usuario: 'cu-2', en_pausa_administrativa: true },
  { id_usuario: 'u-3', correo_electronico: 'tres.qa@example.com', nombre_unidad: 'Semana 8', orden_unidad: 8, id_cronograma_usuario: 'cu-3', cronograma_finalizado: true },
  { id_usuario: 'u-4', correo_electronico: 'cuatro.qa@example.com' },
]);

// Índices de useState en ParticipantProgressPage.
const S = Object.freeze({ summary: 0, participants: 1, loading: 2, loadError: 3 });

async function loadWith(data) {
  mocks.listar.mockResolvedValue(data);
  renderDirect(ParticipantProgressPage);
  hookStub.effects[0]();
  await vi.waitFor(() => expect(hookStub.setters[S.loading]).toHaveBeenCalledWith(false));
  return {
    participants: hookStub.setters[S.participants].mock.calls[0]?.[0],
    summary: hookStub.setters[S.summary].mock.calls[0]?.[0],
  };
}

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.listar.mockReset();
});

describe('Progreso de participantes', () => {
  it('CP-13 usa los datos del backend y sus estadísticas, sin inventar otras', async () => {
    const { participants, summary } = await loadWith({ total: 4, participantes: RAW });

    expect(participants.map((p) => p.participantName)).toEqual([
      'uno.qa@example.com', 'dos.qa@example.com', 'tres.qa@example.com', 'cuatro.qa@example.com',
    ]);
    expect(summary).toEqual({ totalParticipants: 4, activeParticipants: 1, pausedParticipants: 1 });
  });

  it('CP-13 si el backend no envía todos, activos y en pausa quedan sin dato', async () => {
    const { summary } = await loadWith({ total: 10, participantes: RAW });

    expect(summary).toEqual({ totalParticipants: 10, activeParticipants: null, pausedParticipants: null });
    const html = renderToStaticMarkup(renderDirect(ParticipantProgressPage, { [S.summary]: summary, [S.loading]: false }));
    expect(html).not.toMatch(/%/);
    expect(html.match(/>—</g)).toHaveLength(2);
  });

  it('CP-14 conserva la clasificación de estados', async () => {
    const { participants } = await loadWith({ total: 4, participantes: RAW });

    expect(participants.map((p) => p.status)).toEqual(['ACTIVO', 'EN_PAUSA', 'COMPLETADO', null]);
  });

  it('CP-14 un estado desconocido no se presenta como completado', () => {
    const unknown = renderToStaticMarkup(<ParticipantProgressCard participantName="x@example.com" status={null} />);
    const done = renderToStaticMarkup(<ParticipantProgressCard participantName="x@example.com" status="COMPLETADO" />);

    expect(unknown).toContain('Sin estado');
    expect(unknown).not.toContain('Completado');
    expect(done).toContain('Completado');
    expect(renderToStaticMarkup(<ParticipantProgressCard status="EN_PAUSA" />)).toContain('En pausa');
  });

  it('CP-15 navega al detalle con el identificador codificado', () => {
    const tree = renderDirect(ParticipantProgressPage, {
      [S.loading]: false,
      [S.participants]: [{ id: 'u/1', participantName: 'uno.qa@example.com', status: 'ACTIVO' }],
    });
    const [list] = findAll(tree, (el) => el.type === ParticipantProgressList);

    list.props.onViewTemporalInformation({ id: 'u/1' });
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/app/administrativo/cronograma/progreso/u%2F1/informacion-temporal',
    );
    expect(renderToStaticMarkup(tree)).toMatch(/Ver información temporal<span class="sr-only"> de [^<]*uno\.qa@example\.com/);
  });

  it('CP-17 carga, error y vacío se distinguen', async () => {
    const loading = renderToStaticMarkup(renderDirect(ParticipantProgressPage));
    const error = renderToStaticMarkup(renderDirect(ParticipantProgressPage, { [S.loading]: false, [S.loadError]: 'No pudimos consultar el progreso de los participantes.' }));
    const empty = renderToStaticMarkup(renderDirect(ParticipantProgressPage, { [S.loading]: false }));

    expect(loading).toMatch(/role="status"[^>]*>Cargando participantes/);
    expect(error).toMatch(/role="alert"[\s\S]*No pudimos consultar el progreso/);
    expect(empty).toContain('No hay información de progreso para mostrar');

    mocks.listar.mockRejectedValue(new Error('500'));
    renderDirect(ParticipantProgressPage);
    hookStub.effects[0]();
    await vi.waitFor(() =>
      expect(hookStub.setters[S.loadError]).toHaveBeenCalledWith('No pudimos consultar el progreso de los participantes.'),
    );
  });

  it('CP-18 un solo h1 y sin <main>', () => {
    const html = renderToStaticMarkup(renderDirect(ParticipantProgressPage, { [S.loading]: false }));

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });
});
