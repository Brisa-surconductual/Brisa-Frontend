import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import { fetchParticipantSessions } from './fetchParticipantSessions.js';
import { fetchSessionTraceability } from './fetchSessionTraceability.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const SESSION = '00000000-0000-4000-8000-000000000001';

beforeEach(() => vi.resetAllMocks());

describe('fetchParticipantSessions (RF-38)', () => {
  it('GET con límite, sin cursor, y devuelve data', async () => {
    const data = { id_participante: 'P-1A2B3C4D', items: [], total: 0, siguiente_cursor: null };
    apiClient.get.mockResolvedValue({ status: 200, data: { data } });
    const { signal } = new AbortController();

    await expect(fetchParticipantSessions('P-1A2B3C4D', { limit: 20, signal })).resolves.toBe(data);

    const [url, config] = apiClient.get.mock.calls[0];
    expect(url).toMatch(/\/chat\/admin\/participantes\/P-1A2B3C4D\/sesiones$/);
    expect(config).toEqual({ params: { limite: 20 }, signal });
  });

  it('envía el cursor tal cual', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });
    const cursor = 'eyJmIjoiYSIsInMiOiJiIn0_-';

    await fetchParticipantSessions('P-1A2B3C4D', { limit: 20, cursor });

    expect(apiClient.get.mock.calls[0][1].params).toEqual({ limite: 20, cursor });
  });

  it('normaliza el error por codigo', async () => {
    apiClient.get.mockRejectedValue({
      response: { status: 404, data: { codigo: 'PARTICIPANTE_NO_ENCONTRADO', mensaje: 'No se encontró el participante solicitado.' } },
    });

    await expect(fetchParticipantSessions('P-1A2B3C4D')).rejects.toMatchObject({
      status: 404,
      codigo: 'PARTICIPANTE_NO_ENCONTRADO',
      mensaje: 'No se encontró el participante solicitado.',
    });
  });

  it('una petición cancelada se relanza sin normalizar', async () => {
    const controller = new AbortController();
    const canceled = Object.assign(new Error('canceled'), { name: 'CanceledError' });
    apiClient.get.mockImplementation(() => {
      controller.abort();
      return Promise.reject(canceled);
    });

    await expect(fetchParticipantSessions('P-1A2B3C4D', { signal: controller.signal })).rejects.toBe(canceled);
  });
});

describe('fetchSessionTraceability (RF-38)', () => {
  it('GET con codigo_participante y devuelve data', async () => {
    const data = { id_sesion: SESSION, id_participante: 'P-1A2B3C4D', registros: [] };
    apiClient.get.mockResolvedValue({ status: 200, data: { data } });

    await expect(fetchSessionTraceability(SESSION, 'P-1A2B3C4D')).resolves.toBe(data);

    const [url, config] = apiClient.get.mock.calls[0];
    expect(url).toMatch(new RegExp(`/chat/admin/sesiones/${SESSION}/trazabilidad$`));
    expect(config.params).toEqual({ codigo_participante: 'P-1A2B3C4D' });
  });

  it('normaliza el 422', async () => {
    apiClient.get.mockRejectedValue({ response: { status: 422, data: { codigo: 'HISTORIAL_INCONSISTENTE' } } });

    await expect(fetchSessionTraceability(SESSION, 'P-1A2B3C4D')).rejects.toMatchObject({
      status: 422,
      codigo: 'HISTORIAL_INCONSISTENTE',
    });
  });

  it('solo lectura: nunca usa POST, PUT, PATCH ni DELETE', async () => {
    apiClient.get.mockResolvedValue({ status: 200, data: { data: {} } });

    await fetchSessionTraceability(SESSION, 'P-1A2B3C4D');
    await fetchParticipantSessions('P-1A2B3C4D');

    for (const method of ['post', 'put', 'patch', 'delete']) expect(apiClient[method]).not.toHaveBeenCalled();
  });
});
