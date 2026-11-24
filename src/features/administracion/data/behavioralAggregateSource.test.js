import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretBehavioralAggregate } from '../services/behavioralAggregateResponse.js';
import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_SOURCE_MODE,
  AGGREGATE_VIEW_STATUS as S,
} from '../types/behavioralAggregate.js';
import { getAggregateDemoScenario } from '../utils/behavioralAggregateDemoScenario.js';
import { DEMO_AGGREGATE_DATA } from './behavioralAggregateDemoData.js';
import {
  getAggregateSourceMode,
  getBehavioralAggregate,
} from './behavioralAggregateSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';

const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', scenario);
}

const view = async (cohortId = 'demo-cohorte-b') =>
  interpretBehavioralAggregate(
    await getBehavioralAggregate(cohortId),
    cohortId,
  );

beforeEach(() => {
  resetDemoScenarios(vi);
  transport.get.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe('Fuente real de RF-132', () => {
  const id = 'cohorte-real';
  const timestamp = '2026-11-23T11:10:00.000Z';
  const disponible = {
    id_cohorte: id,
    estado: 'DISPONIBLE',
    estado_agregacion: 'ACTUALIZADO',
    ultimo_timestamp_disponible: timestamp,
    motivo_sin_datos: null,
    mensaje: null,
    datos: { total_usuarios_activos: 3, tasa_adherencia_promedio: 0.7342184, id_usuario: 'interno' },
  };
  const desactualizada = {
    ...disponible,
    estado: 'DESACTUALIZADA',
    estado_agregacion: 'ERROR_ACTUALIZACION',
  };
  const sinRespaldo = {
    ...desactualizada,
    estado: 'NO_DISPONIBLE',
    ultimo_timestamp_disponible: null,
    datos: null,
  };
  const error = (status, data) => ({ response: { status, data } });

  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])(
    '%s: consulta únicamente el endpoint del backend',
    async (_, dev, flag) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('VITE_M08_DEMO', flag);

      transport.get.mockResolvedValueOnce({ data: disponible });
      expect(getAggregateSourceMode()).toBe(AGGREGATE_SOURCE_MODE.API);
      const result = await view(id);
      expect(transport.get).toHaveBeenCalledWith(`/admin/cohortes/${id}/vista-agregada`);
      expect(result).toMatchObject({
        status: S.READY,
        data: { activeUsers: 3, averageAdherence: 0.7342184 },
      });
      expect(result.data).not.toHaveProperty('id_usuario');
    },
  );

  it.each([
    ['PENDIENTE', 'SIN_CONSOLIDAR', S.NOT_CONSOLIDATED],
    ['ACTUALIZADO', 'AGREGADO_SUPRIMIDO', S.SUPPRESSED],
  ])('interpreta la respuesta 200 con motivo %s/%s', async (estado_agregacion, motivo_sin_datos, status) => {
    transport.get.mockResolvedValueOnce({
      data: { ...sinRespaldo, estado_agregacion, motivo_sin_datos },
    });
    expect(await view(id)).toMatchObject({ status, data: null });
  });

  it('lee el cuerpo 503 y conserva el respaldo y su fecha', async () => {
    transport.get.mockRejectedValueOnce(error(503, desactualizada));
    expect(await view(id)).toMatchObject({
      status: S.STALE,
      lastAvailableAt: timestamp,
      data: { activeUsers: 3, averageAdherence: 0.7342184 },
    });
  });

  it('distingue el 503 de RF-132 sin respaldo de un error de infraestructura', async () => {
    transport.get.mockRejectedValueOnce(error(503, sinRespaldo));
    transport.get.mockRejectedValueOnce(error(503, '<html>Servicio no disponible</html>'));
    expect(await view(id)).toMatchObject({ status: S.UNAVAILABLE, data: null });
    await expect(getBehavioralAggregate(id)).rejects.toMatchObject({ status: 503 });
  });

  it('descarta un respaldo que declara una cohorte diferente', async () => {
    transport.get.mockRejectedValueOnce(error(503, { ...desactualizada, id_cohorte: 'otra-cohorte' }));
    expect(await view(id)).toMatchObject({ status: S.INCONSISTENT, data: null });
  });

  it('reconoce el 404 de cohorte activa y conserva el diagnóstico del servidor', async () => {
    transport.get.mockRejectedValueOnce(error(404, {
      codigo: 'COHORTE_ACTIVA_NO_ENCONTRADA', mensaje: 'La cohorte no está activa.',
    }));
    transport.get.mockRejectedValueOnce(error(404, { codigo: 'RUTA_NO_ENCONTRADA' }));
    await expect(getBehavioralAggregate(id)).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND, mensaje: 'La cohorte no está activa.',
    });
    await expect(getBehavioralAggregate(id)).rejects.toMatchObject({ status: 404, codigo: 'RUTA_NO_ENCONTRADA' });
  });
});

describe('Puerto de la vista agregada en demostración (RF-132)', () => {
  it('modo demostración solo en desarrollo con la variable activa', () => {
    enableDemo();
    expect(getAggregateSourceMode()).toBe(AGGREGATE_SOURCE_MODE.DEMO);
  });

  it('datos disponibles: la vista de la cohorte pedida, sin campos individuales', async () => {
    enableDemo();
    const raw = await getBehavioralAggregate('demo-cohorte-b');
    expect(transport.get).not.toHaveBeenCalled();
    const result = interpretBehavioralAggregate(raw, 'demo-cohorte-b');

    // La fuente ficticia incluye campos individuales a propósito...
    expect(JSON.stringify(raw)).toContain('PART-0099');
    // ...y la interpretación los descarta.
    expect(result.status).toBe(S.READY);
    expect(result.data.activeUsers).toBe(
      DEMO_AGGREGATE_DATA['demo-cohorte-b'].total_usuarios_activos,
    );
    expect(JSON.stringify(result)).not.toMatch(/PART-|example\.com|id_usuario/);
  });

  it('cada cohorte recibe su propia vista: cambiar de cohorte no muestra datos de otra', async () => {
    enableDemo();
    const b = await view('demo-cohorte-b');
    const c = await view('demo-cohorte-c');

    expect(b.data.activeUsers).toBe(18);
    expect(c.data.activeUsers).toBe(11);
    expect(c.data.averageAdherence).not.toBe(b.data.averageAdherence);
    expect((await getBehavioralAggregate('demo-cohorte-c')).id_cohorte).toBe(
      'demo-cohorte-c',
    );
  });

  it('un cero real se conserva como cero', async () => {
    enableDemo();
    const a = await view('demo-cohorte-a');

    expect(a.data).toMatchObject({
      activeUsers: 0,
      averageAdherence: 0,
      pendingInactivityAlerts: 0,
    });
  });

  it.each([
    ['sin-consolidar', S.NOT_CONSOLIDATED],
    ['desactualizada', S.STALE],
    ['suprimido', S.SUPPRESSED],
    ['no-disponible', S.UNAVAILABLE],
  ])('escenario %s', async (scenario, status) => {
    enableDemo(scenario);
    const result = await view();

    expect(result.status).toBe(status);
    expect(result.data !== null).toBe(status === S.STALE);
  });

  it('desactualizada: entrega la última fecha disponible', async () => {
    enableDemo('desactualizada');
    const result = await view();

    expect(result.lastAvailableAt).toBe(
      DEMO_AGGREGATE_DATA['demo-cohorte-b'].fecha_actualizacion,
    );
  });

  it('suprimido: la fuente lo declara; no hay umbral ni cálculo en el frontend', async () => {
    enableDemo('suprimido');
    const raw = await getBehavioralAggregate('demo-cohorte-b');

    expect(raw).toMatchObject({
      estado: 'NO_DISPONIBLE',
      motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
      datos: null,
    });
  });

  it('una cohorte inexistente se rechaza con código', async () => {
    enableDemo();
    await expect(getBehavioralAggregate('no-existe')).rejects.toMatchObject({
      code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
    });
  });

  it('error y carga', async () => {
    enableDemo('error');
    await expect(getBehavioralAggregate('demo-cohorte-b')).rejects.toThrow(
      'simulado',
    );

    vi.stubEnv('VITE_M08_AGGREGATE_SCENARIO', 'carga');
    const pending = getBehavioralAggregate('demo-cohorte-b');
    const settled = await Promise.race([
      pending.then(() => 'terminó'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);
    expect(settled).toBe('pendiente');
  });

  it('un escenario desconocido muestra datos disponibles', () => {
    expect(
      getAggregateDemoScenario({ VITE_M08_AGGREGATE_SCENARIO: 'otro' }),
    ).toBe('disponible');
  });
});
