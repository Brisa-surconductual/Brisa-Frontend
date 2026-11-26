import { describe, expect, it } from 'vitest';

import { AGGREGATE_VIEW_STATUS as VIEW } from '../types/behavioralAggregate.js';
import {
  DASHBOARD_SECTION as SEC,
  DASHBOARD_STATUS as STATUS,
  PANEL_SOURCE,
} from '../types/cohortDashboard.js';
import {
  interpretDashboardResponse,
  replaceDashboardSection,
} from './cohortDashboardResponse.js';

const id = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
const loadedAt = '2026-11-24T10:00:00.000Z';
const lastAvailable = '2026-11-23T10:00:00.000Z';

const available = (datos) => ({
  id_cohorte: id,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  datos,
});
const unavailable = {
  id_cohorte: id,
  estado: 'NO_DISPONIBLE',
  estado_agregacion: 'ERROR_ACTUALIZACION',
  datos: null,
};
const behavioral = available({
  alertas_inactividad_pendientes: 2,
  alertas_craving_pendientes: 3,
});
const current = {
  id_cohorte: id,
  estado: 'DISPONIBLE',
  fecha_carga_pantalla: loadedAt,
  total_alertas_criticas_pendientes: 5,
  [SEC.BEHAVIORAL]: behavioral,
  [SEC.NARRATIVE]: available({ total_logros_desbloqueados: 29 }),
  [SEC.NOTIFICATIONS]: available({ total_notificaciones_enviadas: 0 }),
};

describe('Contrato HTTP del panel RF-140', () => {
  it('identifica el estado sin cohorte como funcional', () => {
    expect(
      interpretDashboardResponse({
        estado: 'SIN_COHORTE_ACTIVA',
        id_cohorte: null,
      }),
    ).toEqual({ status: STATUS.NO_ACTIVE_COHORT });
  });

  it('conserva las secciones válidas ante un fallo parcial y usa la fecha del servidor', () => {
    const { status, dashboard } = interpretDashboardResponse({
      ...current,
      estado: 'PARCIAL',
      [SEC.NARRATIVE]: unavailable,
      total_alertas_criticas_pendientes: null,
    });
    expect(status).toBe(STATUS.READY);
    expect(dashboard[SEC.NARRATIVE].view).toMatchObject({
      status: VIEW.UNAVAILABLE,
      data: null,
    });
    expect(dashboard[SEC.NOTIFICATIONS].view.data.sentNotifications).toBe(0);
    expect(dashboard[SEC.BEHAVIORAL].view.status).toBe(VIEW.READY);
    expect(dashboard.fecha_carga_pantalla).toBe(loadedAt);
    expect(dashboard.total_alertas_criticas_pendientes).toBeNull();
  });

  it('conserva el respaldo explícito del 503 con su fecha y el total desactualizado', () => {
    const { dashboard } = interpretDashboardResponse({
      ...current,
      estado: 'DESACTUALIZADO',
      [SEC.BEHAVIORAL]: {
        ...behavioral,
        estado: 'DESACTUALIZADA',
        estado_agregacion: 'ERROR_ACTUALIZACION',
        ultimo_timestamp_disponible: lastAvailable,
      },
      [SEC.NARRATIVE]: unavailable,
      [SEC.NOTIFICATIONS]: unavailable,
    });
    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.CACHED);
    expect(dashboard[SEC.BEHAVIORAL].view.lastAvailableAt).toBe(lastAvailable);
    expect(dashboard.alertas_desactualizadas).toBe(true);
    expect(dashboard.total_alertas_criticas_pendientes).toBe(5);
  });

  it('un 503 sin respaldo solo habilita el estado de indisponibilidad', () => {
    const { dashboard } = interpretDashboardResponse({
      ...current,
      estado: 'NO_DISPONIBLE',
      [SEC.BEHAVIORAL]: unavailable,
      [SEC.NARRATIVE]: unavailable,
      [SEC.NOTIFICATIONS]: unavailable,
    });
    expect(dashboard.origen_panel).toBe(PANEL_SOURCE.UNAVAILABLE);
    expect(dashboard.total_alertas_criticas_pendientes).toBeNull();
  });

  it('descarta una sección de otra cohorte junto con su total y conserva las demás', () => {
    const { dashboard } = interpretDashboardResponse({
      ...current,
      [SEC.BEHAVIORAL]: { ...behavioral, id_cohorte: 'otra-cohorte' },
    });
    expect(dashboard[SEC.BEHAVIORAL].view).toMatchObject({
      status: VIEW.INCONSISTENT,
      data: null,
    });
    expect(dashboard.total_alertas_criticas_pendientes).toBeNull();
    expect(dashboard[SEC.NARRATIVE].view.status).toBe(VIEW.READY);
  });

  it('el reintento actualiza la sección solicitada y deja intactas las demás', () => {
    const { dashboard } = interpretDashboardResponse(current);
    const { dashboard: update } = interpretDashboardResponse({
      ...current,
      [SEC.NARRATIVE]: available({ total_logros_desbloqueados: 51 }),
      [SEC.NOTIFICATIONS]: unavailable,
      total_alertas_criticas_pendientes: 0,
    });

    const narrativeRetried = replaceDashboardSection(
      dashboard,
      SEC.NARRATIVE,
      update,
    );
    expect(narrativeRetried[SEC.NARRATIVE].view.data.unlockedAchievements).toBe(
      51,
    );
    expect(narrativeRetried[SEC.NOTIFICATIONS]).toBe(
      dashboard[SEC.NOTIFICATIONS],
    );
    expect(narrativeRetried.total_alertas_criticas_pendientes).toBe(5);

    const behavioralRetried = replaceDashboardSection(
      dashboard,
      SEC.BEHAVIORAL,
      update,
    );
    expect(behavioralRetried.total_alertas_criticas_pendientes).toBe(0);
    expect(behavioralRetried[SEC.NARRATIVE]).toBe(dashboard[SEC.NARRATIVE]);
  });

  it('rechaza un cuerpo incompleto sin fecha del panel', () => {
    expect(
      interpretDashboardResponse({ ...current, fecha_carga_pantalla: null }),
    ).toEqual({ status: STATUS.PANEL_ERROR });
  });
});
