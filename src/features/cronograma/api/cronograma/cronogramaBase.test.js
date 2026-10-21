import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CRONOGRAMA } from '@/shared/utils/constans.jsx';
import { activarCronograma } from './activarCronograma.js';
import { obtenerMiCronograma } from './obtenerMiCronograma.js';
import { obtenerMiContenidoVigente } from '../contenidoVigente/obtenerMiContenidoVigente.jsx';
import { listarUbicacionesTemporalesParticipantes } from '../contenidoVigente/listarUbicacionesTemporalesParticipantes.jsx';
import { obtenerUbicacionTemporalParticipante } from '../contenidoVigente/obtenerUbicacionTemporalParticipante.jsx';
vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());
describe('Contratos del cronograma base', () => {
  it('consulta participantes y detalle por la ruta administrativa real', async () => {
    apiClient.get.mockResolvedValue({
      data: { participantes: [{ id_usuario: 'usuario' }] },
    });
    await listarUbicacionesTemporalesParticipantes();
    expect(apiClient.get).toHaveBeenLastCalledWith(
      `${CRONOGRAMA}/ubicaciones-temporales`,
      { params: { page: 1, page_size: 50 } },
    );
    await expect(
      obtenerUbicacionTemporalParticipante('usuario'),
    ).resolves.toEqual({ id_usuario: 'usuario' });
    expect(apiClient.get).toHaveBeenLastCalledWith(
      `${CRONOGRAMA}/ubicaciones-temporales`,
      { params: { id_usuario: 'usuario', page: 1, page_size: 1 } },
    );
  });
  it('activa solo el cronograma solicitado con confirmación explícita', async () => {
    apiClient.post.mockResolvedValue({ data: { estado: 'ACTIVO' } });
    await expect(activarCronograma('cronograma')).resolves.toEqual({
      estado: 'ACTIVO',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      `${CRONOGRAMA}/cronograma/activar`,
      { confirmacion_activacion: true },
    );
  });
  it('consulta la asignación propia sin enviar identificador de usuario', async () => {
    apiClient.get.mockResolvedValue({ data: { nombre: 'Asignado' } });
    await expect(obtenerMiCronograma()).resolves.toEqual({
      nombre: 'Asignado',
    });
    expect(apiClient.get).toHaveBeenCalledWith(`${CRONOGRAMA}/me`);
  });
  it('consulta contenido sin depender del módulo de chat', async () => {
    apiClient.get.mockResolvedValue({
      status: 200,
      data: [{ id_contenido: 'contenido' }],
    });
    await expect(obtenerMiContenidoVigente()).resolves.toEqual([
      { id_contenido: 'contenido' },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith(
      `${CRONOGRAMA}/me/contenidos-vigentes`,
    );
  });
  it('normaliza 204 a lista vacía', async () => {
    apiClient.get.mockResolvedValue({ status: 204 });
    await expect(obtenerMiContenidoVigente()).resolves.toEqual([]);
  });
});
