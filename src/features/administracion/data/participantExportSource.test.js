import { afterEach, describe, expect, it, vi } from 'vitest';

import { PARTICIPANT_EXPORT_SOURCE_MODE } from '../types/participantExport.js';

import { exportParticipantCsv, getParticipantExportSourceMode } from './participantExportSource.js';

const api = vi.hoisted(() => ({ fetchParticipantExportCsv: vi.fn() }));

vi.mock('../api/participantExportApi.js', () => api);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('Fuente de la exportación individual (RF-145)', () => {
  it('sin demostración usa la API real', async () => {
    vi.stubEnv('VITE_M08_DEMO', '');
    const options = { signal: new AbortController().signal };
    api.fetchParticipantExportCsv.mockResolvedValue({ fileName: 'seguimiento_individual_20261126.csv' });

    expect(getParticipantExportSourceMode()).toBe(PARTICIPANT_EXPORT_SOURCE_MODE.API);
    await exportParticipantCsv('P-1A2B3C4D', options);
    expect(api.fetchParticipantExportCsv).toHaveBeenCalledWith('P-1A2B3C4D', options);
  });

  it('en demostración nunca pide el archivo ni genera uno ficticio', async () => {
    vi.stubEnv('VITE_M08_DEMO', 'true');

    expect(getParticipantExportSourceMode()).toBe(PARTICIPANT_EXPORT_SOURCE_MODE.DEMO_UNAVAILABLE);
    await expect(exportParticipantCsv('P-1A2B3C4D')).rejects.toThrow(/demostración/);
    expect(api.fetchParticipantExportCsv).not.toHaveBeenCalled();
  });
});
