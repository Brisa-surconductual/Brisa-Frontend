import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/utils/apiClient.jsx';
import { obtenerEstadisticasPrograma } from './obtenerEstadisticasPrograma.js';
vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn() },
}));
const stats = {
  estudiantesActivos: 3,
  conRegistroCompleto: 2,
  conRegistroPendiente: 1,
  diasCronogramaBase: 10,
};
beforeEach(() => vi.resetAllMocks());
describe('Contrato de estadísticas administrativas', () => {
  it('consulta el endpoint agregado con cancelación y conserva ceros y null', async () => {
    const vacio = {
      estudiantesActivos: 0,
      conRegistroCompleto: 0,
      conRegistroPendiente: 0,
      diasCronogramaBase: null,
    };
    const signal = new AbortController().signal;
    apiClient.get.mockResolvedValue({ data: vacio });
    await expect(obtenerEstadisticasPrograma({ signal })).resolves.toEqual(
      vacio,
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      '/usuarios/estadisticas-programa',
      { signal, timeout: 30000 },
    );
  });
  it('devuelve los valores reales', async () => {
    apiClient.get.mockResolvedValue({ data: stats });
    await expect(obtenerEstadisticasPrograma()).resolves.toEqual(stats);
  });
  it.each([
    undefined,
    { ...stats, estudiantesActivos: '3' },
    { ...stats, conRegistroPendiente: -1 },
    { ...stats, conRegistroCompleto: 3 },
    { ...stats, diasCronogramaBase: undefined },
  ])('rechaza respuestas incompletas o inconsistentes: %j', async (data) => {
    apiClient.get.mockResolvedValue({ data });
    await expect(obtenerEstadisticasPrograma()).rejects.toThrow('no es válida');
  });
  it('propaga los errores HTTP para distinguir sesión y permisos', async () => {
    const error = { response: { status: 403 } };
    apiClient.get.mockRejectedValue(error);
    await expect(obtenerEstadisticasPrograma()).rejects.toBe(error);
  });
});
