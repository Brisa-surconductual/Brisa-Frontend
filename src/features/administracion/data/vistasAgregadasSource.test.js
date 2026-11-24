import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import { interpretNarrativeAggregate } from '../services/narrativeAggregateResponse.js';
import { interpretNotificationAggregate } from '../services/notificationAggregateResponse.js';
import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../types/behavioralAggregate.js';
import {
  getAggregateSourceMode,
  getBehavioralAggregate,
} from './behavioralAggregateSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import {
  getNarrativeAggregate,
  getNarrativeSourceMode,
} from './narrativeAggregateSource.js';
import {
  getNotificationAggregate,
  getNotificationAggregateSourceMode,
} from './notificationAggregateSource.js';

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

const ID = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
const FECHA = '2026-11-15T05:00:00.000Z';
const envelope = {
  id_cohorte: ID,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: FECHA,
  motivo_sin_datos: null,
  mensaje: null,
};
const sinRespaldo = {
  ...envelope,
  estado: 'NO_DISPONIBLE',
  estado_agregacion: 'ERROR_ACTUALIZACION',
  ultimo_timestamp_disponible: null,
  datos: null,
};

const conductual = {
  rf: 'RF-132',
  path: 'vista-agregada',
  getMode: getAggregateSourceMode,
  getAggregate: getBehavioralAggregate,
  interpret: interpretBehavioralAggregate,
  data: { total_usuarios_activos: 3, tasa_adherencia_promedio: 0.7342184 },
  metrics: { activeUsers: 3, averageAdherence: 0.7342184 },
};
const narrativa = {
  rf: 'RF-133',
  path: 'vistas/narrativa',
  getMode: getNarrativeSourceMode,
  getAggregate: getNarrativeAggregate,
  interpret: interpretNarrativeAggregate,
  data: {
    total_usuarios_cohorte: 18,
    distribucion_por_fase_narrativa: [{ fase: 'INICIO', total: 6 }],
    total_logros_desbloqueados: 29,
  },
  metrics: { cohortUsers: 18, unlockedAchievements: 29 },
};
const notificaciones = {
  rf: 'RF-134',
  path: 'vistas/notificaciones',
  getMode: getNotificationAggregateSourceMode,
  getAggregate: getNotificationAggregate,
  interpret: interpretNotificationAggregate,
  pendingState: 'DISPONIBLE',
  data: {
    tasa_apertura_promedio: null,
    tasa_conversion_promedio: null,
    total_notificaciones_enviadas: 0,
    total_notificaciones_entregadas: 0,
    total_notificaciones_descartadas: 0,
  },
  metrics: {
    averageOpenRate: null,
    averageConversionRate: null,
    sentNotifications: 0,
    deliveredNotifications: 0,
    discardedNotifications: 0,
  },
};

const endpoint = (config) => `/admin/cohortes/${ID}/${config.path}`;
const response = (config) => ({
  ...envelope,
  datos: { ...config.data, id_usuario: 'interno' },
});
const readView = async (config) =>
  config.interpret(await config.getAggregate(ID), ID);
const httpError = (status, data) => ({ response: { status, data } });

beforeEach(() => {
  resetDemoScenarios(vi);
  transport.get.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe.each([conductual, narrativa, notificaciones])(
  '$rf en backend',
  (config) => {
    it.each([
      ['desarrollo sin demo', true, ''],
      ['producción con la variable de demo', false, 'true'],
    ])('%s consulta el endpoint de la cohorte', async (_, dev, flag) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('VITE_M08_DEMO', flag);
      transport.get.mockResolvedValueOnce({ data: response(config) });

      expect(config.getMode()).toBe(AGGREGATE_SOURCE_MODE.API);
      expect(transport.get).not.toHaveBeenCalled();
      const result = await readView(config);
      expect(result).toMatchObject({ status: S.READY, data: config.metrics });
      expect(result.data).not.toHaveProperty('id_usuario');
      expect(transport.get).toHaveBeenCalledExactlyOnceWith(endpoint(config));
    });

    it.each([
      ['PENDIENTE', 'SIN_CONSOLIDAR', S.NOT_CONSOLIDATED],
      ['ACTUALIZADO', 'AGREGADO_SUPRIMIDO', S.SUPPRESSED],
    ])(
      'interpreta %s/%s como estado funcional',
      async (estadoAgregacion, motivo, status) => {
        transport.get.mockResolvedValueOnce({
          data: {
            ...sinRespaldo,
            estado:
              estadoAgregacion === 'PENDIENTE'
                ? (config.pendingState ?? 'NO_DISPONIBLE')
                : 'NO_DISPONIBLE',
            estado_agregacion: estadoAgregacion,
            motivo_sin_datos: motivo,
          },
        });
        expect(await readView(config)).toMatchObject({ status, data: null });
      },
    );

    it('conserva el respaldo del 503 y descarta otro de una cohorte diferente', async () => {
      const stale = {
        ...response(config),
        estado: 'DESACTUALIZADA',
        estado_agregacion: 'ERROR_ACTUALIZACION',
      };
      transport.get
        .mockRejectedValueOnce(httpError(503, stale))
        .mockRejectedValueOnce(
          httpError(503, { ...stale, id_cohorte: 'otra-cohorte' }),
        );

      expect(await readView(config)).toMatchObject({
        status: S.STALE,
        lastAvailableAt: FECHA,
        data: config.metrics,
      });
      expect(await readView(config)).toMatchObject({
        status: S.INCONSISTENT,
        data: null,
      });
    });

    it('distingue el 503 sin respaldo de un error de infraestructura', async () => {
      transport.get
        .mockRejectedValueOnce(httpError(503, sinRespaldo))
        .mockRejectedValueOnce(
          httpError(503, '<html>Servicio no disponible</html>'),
        );

      expect(await readView(config)).toMatchObject({
        status: S.UNAVAILABLE,
        data: null,
      });
      await expect(config.getAggregate(ID)).rejects.toMatchObject({
        status: 503,
      });
    });

    it('propaga el mensaje sólo para el 404 de cohorte activa', async () => {
      const mensaje = 'No existe una cohorte activa disponible.';
      transport.get
        .mockRejectedValueOnce(
          httpError(404, { codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA', mensaje }),
        )
        .mockRejectedValueOnce(
          httpError(404, { codigo: 'RUTA_NO_ENCONTRADA' }),
        );

      await expect(config.getAggregate(ID)).rejects.toMatchObject({
        code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
        mensaje,
      });
      await expect(config.getAggregate(ID)).rejects.toMatchObject({
        status: 404,
        codigo: 'RUTA_NO_ENCONTRADA',
      });
    });
  },
);

it.each([
  { failed: narrativa, healthy: notificaciones },
  { failed: notificaciones, healthy: narrativa },
])(
  'la caída de $failed.rf permite consultar $healthy.rf',
  async ({ failed, healthy }) => {
    transport.get.mockImplementation((url) => {
      if (url === endpoint(failed))
        return Promise.reject(httpError(503, sinRespaldo));
      if (url === endpoint(healthy))
        return Promise.resolve({ data: response(healthy) });
      throw new Error('Ruta inesperada');
    });

    const [affectedView, availableView] = await Promise.all([
      readView(failed),
      readView(healthy),
    ]);

    expect(affectedView.status).toBe(S.UNAVAILABLE);
    expect(availableView).toMatchObject({
      status: S.READY,
      data: healthy.metrics,
    });
  },
);
