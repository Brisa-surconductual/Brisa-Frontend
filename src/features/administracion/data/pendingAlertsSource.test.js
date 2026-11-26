import { afterEach, describe, expect, it, vi } from 'vitest';

import { PENDING_ALERTS_SOURCE_MODE } from '../types/pendingAlerts.js';

import { attendAlert, fetchPendingAlerts, getPendingAlertsSourceMode } from './pendingAlertsSource.js';

const api = vi.hoisted(() => ({ fetchPendingAlerts: vi.fn(), attendAlert: vi.fn() }));

vi.mock('../api/alertasPendientesApi.js', () => api);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Fuente de alertas pendientes (RF-146, RF-147)', () => {
  it('sin demostración usa la API real', async () => {
    vi.stubEnv('VITE_M08_DEMO', '');
    api.fetchPendingAlerts.mockResolvedValue(null);
    api.attendAlert.mockResolvedValue({ estado: 'ATENDIDA' });

    expect(getPendingAlertsSourceMode()).toBe(PENDING_ALERTS_SOURCE_MODE.API);
    await fetchPendingAlerts('c-1', { offset: 0, limit: 20 });
    await attendAlert('a-1', 'Motivo suficiente.');
    expect(api.fetchPendingAlerts).toHaveBeenCalledWith('c-1', { offset: 0, limit: 20 }, undefined);
    expect(api.attendAlert).toHaveBeenCalledWith('a-1', 'Motivo suficiente.');
  });

  it('en demostración nunca consulta ni escribe en el servidor', async () => {
    vi.stubEnv('VITE_M08_DEMO', 'true');

    expect(getPendingAlertsSourceMode()).toBe(PENDING_ALERTS_SOURCE_MODE.DEMO_UNAVAILABLE);
    await expect(fetchPendingAlerts('demo-cohorte-a', { offset: 0, limit: 20 })).rejects.toThrow(/demostración/);
    await expect(attendAlert('a-1', 'Motivo suficiente.')).rejects.toThrow(/demostración/);
    expect(api.fetchPendingAlerts).not.toHaveBeenCalled();
    expect(api.attendAlert).not.toHaveBeenCalled();
  });
});
