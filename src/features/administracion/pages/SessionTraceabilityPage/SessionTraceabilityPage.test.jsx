import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { interpretSessionTrace } from '../../services/sessionTraceResponse.js';
import { TRACE_QUERY_STATUS as S } from '../../types/chatTraceability.js';

import { SessionTraceabilityPage } from './SessionTraceabilityPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

vi.mock('./hooks/useSessionTraceability.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSessionTraceability: (args) => {
      hook.args = args;
      return hook.value ?? actual.useSessionTraceability(args);
    },
  };
});

const CODE = 'P-1A2B3C4D';
const SESSION = '00000000-0000-4000-8000-000000000001';
const NODE = '00000000-0000-4000-8000-00000000000a';
const PATH = `/app/administrativo/chat/participantes/${CODE}/sesiones/${SESSION}/trazabilidad`;

const record = (secuencia, changes = {}) => ({
  secuencia,
  id_nodo: NODE,
  respuesta_usuario: { valor: 'si' },
  id_nodo_destino: NODE,
  timestamp_interaccion: '2026-11-20T14:00:00.000Z',
  tipo_entrada: 'OPCION_UNICA',
  contenido_historico: 'VERIFICADO',
  motivo_no_verificable: null,
  tipo_nodo: 'PREGUNTA',
  texto_nodo: '¿Dormiste bien?',
  etiqueta_respuesta: 'Sí, bien',
  ...changes,
});

const TRACE = interpretSessionTrace(
  {
    id_sesion: SESSION,
    id_participante: CODE,
    registros: [
      record(2, {
        respuesta_usuario: { valor: null },
        id_nodo_destino: null,
        tipo_entrada: 'CONTINUAR',
        contenido_historico: 'NO_VERIFICABLE',
        motivo_no_verificable: 'NODO_MODIFICADO_TRAS_PUBLICACION',
        tipo_nodo: null,
        texto_nodo: null,
        etiqueta_respuesta: null,
      }),
      record(1),
    ],
  },
  { sessionId: SESSION, code: CODE },
).trace;

const state = (changes = {}) => ({
  code: CODE,
  sessionId: SESSION,
  status: S.READY,
  trace: TRACE,
  error: null,
  headingRef: { current: null },
  retry: vi.fn(),
  ...changes,
});

function renderPage(value, path = PATH) {
  hook.value = value;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app/administrativo/chat/participantes/:codigoParticipante/sesiones/:idSesion/trazabilidad"
          element={<SessionTraceabilityPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  hook.value = null;
  hook.args = null;
});

describe('SessionTraceabilityPage (RF-38)', () => {
  it('pasa al hook el código y la sesión de la ruta', () => {
    renderPage(state());
    expect(hook.args).toEqual({ participantCode: CODE, sessionId: SESSION });
  });

  it('línea de tiempo en orden de secuencia, como lista ordenada', () => {
    const html = renderPage(state());

    expect(html).toContain('<ol aria-label="Interacciones de la sesión"');
    expect(html.indexOf('Interacción 1')).toBeLessThan(html.indexOf('Interacción 2'));
    expect(html).toContain('Interacciones (2)');
  });

  it('contenido verificado: texto exacto, etiqueta y valor original', () => {
    const html = renderPage(state());

    expect(html).toContain('Contenido verificado');
    expect(html).toContain('¿Dormiste bien?');
    expect(html).toContain('Opción elegida: <span class="font-bold text-[var(--text-primary)]">Sí, bien</span>');
    expect(html).toMatch(/>si<\/p>/);
  });

  it('no verificable: advierte con el motivo y no muestra texto', () => {
    const html = renderPage(state());

    expect(html).toContain('Contenido no verificable');
    expect(html).toContain('El contenido se modificó después de publicarse la versión del árbol.');
    expect(html).toContain('NODO_MODIFICADO_TRAS_PUBLICACION');
  });

  it('CONTINUAR con null y fin del flujo', () => {
    const html = renderPage(state());

    expect(html).toContain('El participante avanzó al siguiente paso');
    expect(html).toContain('Fin del flujo conversacional');
    expect(html).toContain('Continúa al siguiente contenido');
  });

  it('volver a las sesiones del mismo participante', () => {
    expect(renderPage(state())).toContain(`href="/app/administrativo/chat/participantes/${CODE}/sesiones"`);
  });

  it('sin interacciones', () => {
    const html = renderPage(state({ trace: { ...TRACE, records: [] } }));

    expect(html).toContain('Sin interacciones');
    expect(html).not.toContain('Interacción 1');
  });

  it.each([
    [S.INCONSISTENT_HISTORY, 'Historial inconsistente', false],
    [S.SESSION_NOT_FOUND, 'Sesión no encontrada', false],
    [S.MISMATCH, 'Información no mostrada', true],
    [S.INVALID_RESPONSE, 'Respuesta no válida', true],
    [S.SERVER_ERROR, 'Consulta no disponible', true],
    [S.DENIED, 'Acceso denegado', false],
  ])('%s: sin registros parciales', (status, title, canRetry) => {
    const html = renderPage(state({ status, trace: null, error: { status, message: '', canRetry } }));

    expect(html).toContain(title);
    expect(html).not.toContain('Interacción 1');
    expect(html.includes('Reintentar')).toBe(canRetry);
  });

  it('enlace inválido: no consulta y vuelve a cohortes', () => {
    hook.value = null;
    const html = renderPage(null, `/app/administrativo/chat/participantes/seg-0001/sesiones/${SESSION}/trazabilidad`);

    expect(html).toContain('Enlace no válido');
    expect(html).toContain('Volver a cohortes');
    expect(html).not.toContain('aria-busy');
  });

  it('401: no muestra contenido', () => {
    expect(renderPage(state({ status: S.UNAUTHENTICATED, trace: null }))).not.toContain('Trazabilidad de la sesión');
  });

  it('solo lectura: sin formularios ni acciones de escritura o descarga', () => {
    const html = renderPage(state());

    expect(html).not.toMatch(/<form|<input|<textarea|<button/);
    expect(html).not.toMatch(/Editar|Eliminar|Reenviar|Descargar|Exportar/);
  });
});
