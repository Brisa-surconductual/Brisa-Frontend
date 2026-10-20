import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '../../../shared/utils/apiClient.jsx';
import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { renovarConsentimientoRegistro } from './validacionConsetimeinto.jsx';

vi.mock('../../../shared/utils/apiClient.jsx', () => ({
  apiClient: { post: vi.fn() },
}));

const documento = {
  idConsentimeinto: '00000000-0000-4000-8000-000000000001',
  versionConsetimeinto: '2026-10',
  vigente: true,
  urlContenido: 'Texto vigente del consentimiento de prueba.',
};
const aceptacion = {
  consentimiento: documento,
  personalDataAccepted: true,
  consumptionHistoryAccepted: true,
};

beforeEach(() => vi.resetAllMocks());

describe('renovación del consentimiento de registro', () => {
  it('mantiene la aceptación en el borrador sin crear ni actualizar usuarios inexistentes', async () => {
    await expect(renovarConsentimientoRegistro(aceptacion)).resolves.toEqual({
      personalDataAccepted: true,
      consumptionHistoryAccepted: true,
      consentVersion: documento.versionConsetimeinto,
      idConsentimeinto: documento.idConsentimeinto,
      status: 'VIGENTE',
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('actualiza la cuenta existente con el contrato exacto del backend y nunca la vuelve a crear', async () => {
    const idUsuario = '00000000-0000-4000-8000-000000000002';
    apiClient.post.mockResolvedValue({
      data: { mensaje: 'Consentimiento actualizado correctamente' },
    });

    await expect(
      renovarConsentimientoRegistro({ ...aceptacion, idUsuario }),
    ).resolves.toMatchObject({ status: 'VIGENTE' });
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
      `${USUARIOS}/actualizar-consentimiento`,
      { idUsuario, idConsentimeinto: documento.idConsentimeinto },
    );
  });

  it.each([400, 401, 404, 500])(
    'conserva el fallo HTTP %s y no devuelve una aceptación exitosa',
    async (status) => {
      const error = {
        response: { status, data: { message: 'No se pudo actualizar' } },
      };
      apiClient.post.mockRejectedValue(error);
      await expect(
        renovarConsentimientoRegistro({
          ...aceptacion,
          idUsuario: 'usuario-existente',
        }),
      ).rejects.toBe(error);
    },
  );

  it.each([
    { personalDataAccepted: false },
    { consumptionHistoryAccepted: false },
  ])(
    'no envía la actualización si falta alguna autorización: %j',
    async (autorizaciones) => {
      await expect(
        renovarConsentimientoRegistro({
          ...aceptacion,
          ...autorizaciones,
          idUsuario: 'usuario-existente',
        }),
      ).rejects.toThrow('ambas autorizaciones');
      expect(apiClient.post).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { ...documento, vigente: false },
    { ...documento, idConsentimeinto: '' },
    { ...documento, versionConsetimeinto: '' },
    { ...documento, urlContenido: '' },
  ])(
    'rechaza documentos ausentes, incompletos o no vigentes: %j',
    async (consentimiento) => {
      await expect(
        renovarConsentimientoRegistro({ ...aceptacion, consentimiento }),
      ).rejects.toThrow('documento de consentimiento vigente');
      expect(apiClient.post).not.toHaveBeenCalled();
    },
  );
});
