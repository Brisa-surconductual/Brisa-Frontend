import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { interpretParticipantSessions } from '../../services/participantSessionsResponse.js';
import { TRACE_QUERY_STATUS as S } from '../../types/chatTraceability.js';

import { ParticipantSessionsPage } from './ParticipantSessionsPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useParticipantSessions.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantSessions: (args) => {
      hook.args = args;
      return hook.value ?? actual.useParticipantSessions(args);
    },
  };
});

const CODE = 'P-1A2B3C4D';
const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;

const PAGE = interpretParticipantSessions(
  {
    id_participante: CODE,
    items: [
      { id_sesion: id(1), modalidad: 'SOS', estado: 'ACTIVA', fecha_inicio: '2026-11-20T14:00:00.000Z', fecha_ultima_interaccion: '2026-11-20T14:20:00.000Z' },
      { id_sesion: id(2), modalidad: 'GRUPAL', estado: 'ERROR_CONFIGURACION', fecha_inicio: '2026-11-19T14:00:00.000Z', fecha_ultima_interaccion: 'sin zona' },
    ],
    total: 5,
    siguiente_cursor: 'c1',
  },
  { code: CODE },
).page;

const state = (changes = {}) => ({
  code: CODE,
  status: S.READY,
  page: PAGE,
  error: null,
  isLoadingMore: false,
  loadMoreError: null,
  headingRef: { current: null },
  loadMore: vi.fn(),
  retry: vi.fn(),
  ...changes,
});

function renderPage(value, { path = `/app/administrativo/chat/participantes/${CODE}/sesiones`, from } = {}) {
  hook.value = value;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[{ pathname: path, state: from ? { from } : null }]}>
      <Routes>
        <Route path="/app/administrativo/chat/participantes/:codigoParticipante/sesiones" element={<ParticipantSessionsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  hook.value = null;
  hook.args = null;
});

describe('ParticipantSessionsPage (RF-38)', () => {
  it('pasa al hook el código de la ruta', () => {
    renderPage(state());
    expect(hook.args).toEqual({ participantCode: CODE });
  });

  it('muestra el código seudonimizado, las sesiones (incluida SOS) y el total sin confundirlo con lo cargado', () => {
    const html = renderPage(state());

    expect(html).toContain(CODE);
    expect(html).toContain('SOS');
    expect(html).toContain('Activa');
    expect(html).toContain('Error de configuración');
    expect(html).toContain('Mostrando 2 de 5 sesiones');
    expect(html).toContain('<time dateTime="2026-11-20T14:00:00.000Z">');
    expect(html).toContain('Fecha no disponible');
  });

  it('enlaza a la trazabilidad de cada sesión con código y UUID', () => {
    const html = renderPage(state());

    expect(html).toContain(`href="/app/administrativo/chat/participantes/${CODE}/sesiones/${id(1)}/trazabilidad"`);
    expect(html).toContain('Ver trazabilidad');
  });

  it('ofrece cargar más mientras haya cursor y no en la última página', () => {
    expect(renderPage(state())).toContain('Cargar más sesiones');
    expect(renderPage(state({ page: { ...PAGE, nextCursor: null } }))).not.toContain('Cargar más sesiones');
  });

  it('un error al cargar más se muestra con reintento manual y conserva lo cargado', () => {
    const html = renderPage(state({ loadMoreError: { status: S.SERVER_ERROR, message: '', canRetry: true } }));

    expect(html).toContain('Reintentar');
    expect(html).toContain('Ver trazabilidad');
    expect(html).not.toContain('Cargar más sesiones');
  });

  it('cargando: estado accesible y sin datos', () => {
    const html = renderPage(state({ status: S.LOADING, page: null }));

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando las sesiones del participante');
    expect(html).not.toContain('Ver trazabilidad');
  });

  it('sin sesiones', () => {
    const html = renderPage(state({ page: { ...PAGE, sessions: [], total: 0, nextCursor: null } }));

    expect(html).toContain('Sin sesiones');
    expect(html).not.toContain('Ver trazabilidad');
  });

  it('código A7 inválido: aviso y ninguna consulta', () => {
    hook.value = null;
    const html = renderPage(null, { path: '/app/administrativo/chat/participantes/seg-0001/sesiones' });

    expect(html).toContain('Código de participante no válido');
    expect(html).not.toContain('aria-busy');
  });

  it.each([
    [S.DENIED, 'Acceso denegado', false],
    [S.PARTICIPANT_NOT_FOUND, 'Participante no encontrado', false],
    [S.SERVER_ERROR, 'Consulta no disponible', true],
    [S.CONNECTION_ERROR, 'Sin conexión', true],
    [S.MISMATCH, 'Información no mostrada', true],
  ])('%s: aviso sin datos', (status, title, canRetry) => {
    const html = renderPage(state({ status, page: null, error: { status, message: '', canRetry } }));

    expect(html).toContain(title);
    expect(html).not.toContain('Ver trazabilidad');
    expect(html.includes('Reintentar')).toBe(canRetry);
  });

  it('muestra el mensaje del backend tal cual', () => {
    const html = renderPage(state({ status: S.PARTICIPANT_NOT_FOUND, page: null, error: { status: S.PARTICIPANT_NOT_FOUND, message: 'No se encontró el participante solicitado.', canRetry: false } }));

    expect(html).toContain('No se encontró el participante solicitado.');
  });

  it('401: no muestra contenido (redirige al inicio de sesión)', () => {
    const html = renderPage(state({ status: S.UNAUTHENTICATED, page: null }));

    expect(html).not.toContain('Sesiones del chat');
  });

  it('volver: a cohortes por defecto, o al origen administrativo seguro', () => {
    expect(renderPage(state())).toContain('Volver a cohortes');
    expect(renderPage(state(), { from: '/app/administrativo/cohortes/c-1/seguimiento/seg-1' })).toContain(
      'href="/app/administrativo/cohortes/c-1/seguimiento/seg-1"',
    );
    expect(renderPage(state(), { from: 'https://malicioso.example' })).not.toContain('malicioso');
  });

  it('solo lectura: sin formularios ni acciones de escritura o descarga', () => {
    const html = renderPage(state());

    expect(html).toContain('Información de solo lectura');
    expect(html).not.toMatch(/<form|<input|<textarea/);
    expect(html).not.toMatch(/Editar|Eliminar|Reenviar|Descargar|Exportar/);
  });
});
