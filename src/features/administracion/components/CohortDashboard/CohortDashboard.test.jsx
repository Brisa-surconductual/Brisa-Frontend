import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { DEMO_AGGREGATE_DATA } from '../../data/behavioralAggregateDemoData.js';
import {
  DEMO_NARRATIVE_DATA,
  DEMO_NARRATIVE_FORBIDDEN_FIELDS,
} from '../../data/narrativeAggregateDemoData.js';
import {
  DEMO_NOTIFICATION_DATA,
  DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
} from '../../data/notificationAggregateDemoData.js';
import { DEMO_FORBIDDEN_FIELDS } from '../../data/behavioralAggregateDemoData.js';
import {
  assembleDashboard,
  loadDashboardSections,
  rememberValidSections,
} from '../../services/cohortDashboard.js';
import { createDashboardCache } from '../../services/dashboardCache.js';
import {
  DASHBOARD_SECTION as SEC,
  DASHBOARD_STATUS as ST,
} from '../../types/cohortDashboard.js';
import { SectionErrorBoundary } from '../SectionErrorBoundary/index.js';
import { BarList } from './BarList.jsx';
import { BehavioralSummary } from './BehavioralSummary.jsx';
import { CohortDashboard } from './CohortDashboard.jsx';
import { CriticalAlertsCard } from './CriticalAlertsCard.jsx';
import { DashboardWidget } from './DashboardWidget.jsx';
import { NarrativeSummary } from './NarrativeSummary.jsx';
import { NotificationSummary } from './NotificationSummary.jsx';
import { RateGauge } from './RateGauge.jsx';
import { WidgetStateNotice } from './WidgetStateNotice.jsx';

const hook = vi.hoisted(() => ({ value: null }));

vi.mock('../../hooks/useCohortDashboard.js', () => ({
  useCohortDashboard: () => hook.value,
}));

const COHORT = Object.freeze({
  id: 'demo-cohorte-b',
  name: 'Cohorte Piloto B',
  status: 'ACTIVA',
});
const LOADED = '2026-11-22T14:00:00.000Z';

// Respuestas del contrato con datos individuales prohibidos añadidos.
const envelope = (datos, extra) => ({
  id_cohorte: COHORT.id,
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-20T13:00:00Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: { ...datos, ...extra },
  ...extra,
});

const ok = (value) => () => Promise.resolve(value);
const fail = () => () => Promise.reject(new Error('caída'));

const QUERIES = Object.freeze({
  [SEC.BEHAVIORAL]: ok(
    envelope(DEMO_AGGREGATE_DATA[COHORT.id], DEMO_FORBIDDEN_FIELDS),
  ),
  [SEC.NARRATIVE]: ok(
    envelope(DEMO_NARRATIVE_DATA[COHORT.id], DEMO_NARRATIVE_FORBIDDEN_FIELDS),
  ),
  [SEC.NOTIFICATIONS]: ok(
    envelope(
      DEMO_NOTIFICATION_DATA[COHORT.id],
      DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
    ),
  ),
});

async function dashboardWith(
  changes = {},
  cache = createDashboardCache(),
  timeoutMs,
) {
  const results = await loadDashboardSections(
    COHORT.id,
    { ...QUERIES, ...changes },
    timeoutMs,
  );
  rememberValidSections(cache, COHORT.id, results, LOADED);
  return assembleDashboard({
    cohortId: COHORT.id,
    results,
    loadedAt: LOADED,
    cache,
  });
}

const BASE = Object.freeze({
  status: ST.READY,
  cohort: COHORT,
  activeCohorts: [COHORT],
  dashboard: null,
  retryingSections: [],
  isDemo: true,
  isIntegrationPending: false,
  reload: vi.fn(),
  retrySection: vi.fn(),
});

function render(changes = {}) {
  hook.value = { ...BASE, ...changes };
  return renderToStaticMarkup(
    <MemoryRouter>
      <CohortDashboard />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

afterEach(() => {
  hook.value = null;
});

describe('Panel principal (RF-140): presentación', () => {
  it('identifica la cohorte activa con la fecha de carga', async () => {
    const text = textOf(render({ dashboard: await dashboardWith() }));

    expect(text).toContain('Cohorte activa Cohorte Piloto B');
    expect(text).toContain(
      'Panel cargado el 22 de nov de 2026, 09:00 (hora de Colombia)',
    );
  });

  it('orden de prioridad: alertas, conducta, narrativa, notificaciones y accesos', async () => {
    const html = render({ dashboard: await dashboardWith() });
    const order = [
      'Alertas críticas pendientes',
      'Conducta y adherencia',
      'Progresión narrativa y gamificación',
      'Efectividad de notificaciones',
      'Accesos de la cohorte activa',
    ].map((title) => html.indexOf(`${title}`));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('el total de alertas es la suma de inactividad (2) y craving (1) de RF-132', async () => {
    const text = textOf(render({ dashboard: await dashboardWith() }));

    expect(text).toMatch(/Alertas críticas pendientes 3 /);
    expect(text).toContain('Alertas de inactividad 2');
    expect(text).toContain('Alertas de craving elevado 1');
  });

  it('el total es el elemento más destacado del panel', async () => {
    const html = render({ dashboard: await dashboardWith() });

    expect(html).toMatch(
      /data-critical-total="[^"]*"><span class="[^"]*font-size-4xl[^"]*">3<\/span>/,
    );
    expect(html.match(/font-size-4xl/g)).toHaveLength(1);
  });

  it('widgets compactos con los valores originales de RF-132, RF-133 y RF-134, sin recalcular', async () => {
    const html = render({ dashboard: await dashboardWith() });
    const text = textOf(html);

    expect(text).toContain('Participantes activos 18');
    expect(text).toContain('Adherencia promedio 0,7342');
    expect(text).toMatch(/Inicio 4 .*Desarrollo 9 .*Cierre 3/);
    expect(text).toContain('Tasa de apertura promedio 0,5825');
    expect(text).toContain('Tasa de conversión promedio 0,3125');
    expect(text).toContain('Enviadas 412');
    expect(text).toContain('Programa completado 2');
    expect(text).not.toContain('%');
    // Compactos: no copian las tarjetas completas de las páginas.
    expect(text).not.toContain('Participación y adherencia');
    expect(text).not.toContain('Modo degradado');
    expect(html.match(/Datos agregados: no identifican/g)).toHaveLength(3);
  });

  it('cada widget enlaza a su vista detallada con «Ver detalle»', async () => {
    const html = render({ dashboard: await dashboardWith() });

    for (const path of [
      'vista-agregada',
      'vista-narrativa',
      'vista-notificaciones',
    ]) {
      expect(html).toMatch(
        new RegExp(
          `href="/app/administrativo/cohortes/demo-cohorte-b/${path}"[^>]*>Ver detalle`,
        ),
      );
    }
  });

  it('cada sección indica su disponibilidad y enlaza a su vista detallada', async () => {
    const html = render({ dashboard: await dashboardWith() });

    expect(html.match(/Estado de la vista: <\/span>Disponible/g)).toHaveLength(
      3,
    );
    for (const path of [
      'vista-agregada',
      'vista-narrativa',
      'vista-notificaciones',
      'seguimiento',
    ]) {
      expect(html).toContain(
        `href="/app/administrativo/cohortes/demo-cohorte-b/${path}"`,
      );
    }
    expect(html).toContain('href="/app/administrativo/cohortes"');
  });

  it('no muestra datos individuales', async () => {
    const html = render({ dashboard: await dashboardWith() });

    expect(html).not.toMatch(
      /PART-\d|example\.com|Participante (narrativo |notificado )?ficticio|Mensaje ficticio|RECORDATORIO|Capítulo ficticio|Logro ficticio/,
    );
    expect(html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it('datos de demostración: lo indica de forma visible', async () => {
    expect(render({ dashboard: await dashboardWith() })).toContain(
      'Datos de demostración',
    );
  });
});

describe('Panel principal (RF-140): fallas y estados degradados', () => {
  it('una vista que falla se marca y las demás se muestran', async () => {
    const html = render({
      dashboard: await dashboardWith({ [SEC.NARRATIVE]: fail() }),
    });
    const text = textOf(html);

    expect(text).toContain(
      'La vista de progresión narrativa no está disponible en este momento. Se muestra el panorama con la información restante disponible.',
    );
    expect(text).toContain('Participantes activos 18');
    expect(text).toContain('Enviadas 412');
    expect(html).toContain('Estado de la vista: </span>No disponible');
  });

  it('una vista que excede el tiempo límite lo indica', async () => {
    const dashboard = await dashboardWith(
      { [SEC.NOTIFICATIONS]: () => new Promise(() => {}) },
      createDashboardCache(),
      30,
    );

    expect(textOf(render({ dashboard }))).toContain(
      'La vista de notificaciones no respondió a tiempo.',
    );
  });

  it('sin el agregado conductual, las alertas son «No disponible», no cero', async () => {
    const text = textOf(
      render({ dashboard: await dashboardWith({ [SEC.BEHAVIORAL]: fail() }) }),
    );

    expect(text).toMatch(/Alertas críticas pendientes .*No disponible/);
    expect(text).toContain('el total no se muestra');
  });

  it('las tres fallan sin caché: panel no disponible con reintento y sin secciones', async () => {
    const html = render({
      dashboard: await dashboardWith({
        [SEC.BEHAVIORAL]: fail(),
        [SEC.NARRATIVE]: fail(),
        [SEC.NOTIFICATIONS]: fail(),
      }),
    });

    expect(html).toContain(
      'ninguna de las fuentes de información pudo ser consultada',
    );
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Conducta y adherencia');
  });

  it('las tres fallan con caché: última versión marcada como desactualizada', async () => {
    const cache = createDashboardCache();
    await dashboardWith({}, cache);
    const html = render({
      dashboard: await dashboardWith(
        {
          [SEC.BEHAVIORAL]: fail(),
          [SEC.NARRATIVE]: fail(),
          [SEC.NOTIFICATIONS]: fail(),
        },
        cache,
      ),
    });
    const text = textOf(html);

    expect(text).toContain('Se muestra la última versión conservada');
    expect(text).toContain('Vista conservada de la carga del panel');
    expect(text).toContain('El total proviene de datos desactualizados');
    expect(
      html.match(/Estado de la vista: <\/span>Desactualizada/g),
    ).toHaveLength(3);
    expect(text).toContain('Participantes activos 18');
  });

  it('reintentar una sección solo la consulta a ella', async () => {
    const retrySection = vi.fn();
    hook.value = {
      ...BASE,
      dashboard: await dashboardWith({ [SEC.NARRATIVE]: fail() }),
      retrySection,
    };
    const narrative = hook.value.dashboard[SEC.NARRATIVE];
    const element = WidgetStateNotice({
      outcome: narrative.outcome,
      view: narrative.view,
      dimension: 'progresión narrativa',
      moduleLabel: 'gamificación',
      onRetry: () => retrySection(SEC.NARRATIVE),
    });

    expect(renderToStaticMarkup(element)).toContain('Reintentar');
    element.props.action.props.onRetry();
    expect(retrySection).toHaveBeenCalledWith(SEC.NARRATIVE);
  });

  it('sección en reintento: anuncio de carga accesible', async () => {
    const html = render({
      dashboard: await dashboardWith(),
      retryingSections: [SEC.NOTIFICATIONS],
    });

    expect(html).toContain('Cargando la vista de notificaciones...');
  });
});

describe('Panel principal (RF-140): cohorte activa', () => {
  it('sin cohorte activa: mensaje funcional y acceso a Cohortes, sin indicadores', () => {
    const html = render({
      status: ST.NO_ACTIVE_COHORT,
      cohort: null,
      activeCohorts: [],
    });

    expect(html).toContain(
      'No existe una cohorte activa en este momento. Cree o active una cohorte para comenzar a visualizar el panel principal.',
    );
    expect(html).toContain('href="/app/administrativo/cohortes"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Alertas críticas pendientes');
  });

  it('varias cohortes activas: no elige ninguna y enlaza a cada una', () => {
    const html = render({
      status: ST.MULTIPLE_ACTIVE_COHORTS,
      cohort: null,
      activeCohorts: [
        { id: 'demo-cohorte-a', name: 'Cohorte Piloto A' },
        COHORT,
      ],
    });

    expect(html).toContain('Hay 2 cohortes activas');
    expect(html).toContain(
      'href="/app/administrativo/cohortes/demo-cohorte-a"',
    );
    expect(html).not.toContain('Alertas críticas pendientes');
  });

  it('error al identificar la cohorte: aviso con reintento', () => {
    const html = render({ status: ST.COHORTS_ERROR, cohort: null });

    expect(html).toContain('No pudimos identificar la cohorte activa');
    expect(html).toContain('Reintentar');
  });

  it('cargando: anuncio accesible y sin datos de otra cohorte', () => {
    const html = render({ status: ST.LOADING, cohort: null, dashboard: null });

    expect(html).toContain('Identificando la cohorte activa...');
    expect(html).not.toContain('Participantes activos');
  });

  it('integración pendiente: lo indica y no muestra indicadores', () => {
    const html = render({
      status: ST.PENDING_INTEGRATION,
      cohort: null,
      isDemo: false,
      isIntegrationPending: true,
    });

    expect(html).toContain('integración pendiente');
    expect(html).not.toContain('Datos de demostración');
    expect(html).not.toContain('Alertas críticas pendientes');
  });
});

describe('Panel principal (RF-140): límites de error por sección', () => {
  function boundaries(node, found = []) {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
      node.forEach((child) => boundaries(child, found));
      return found;
    }
    if (node.type === SectionErrorBoundary) found.push(node);
    boundaries(node.props?.children, found);
    return found;
  }

  it('alertas y cada vista tienen su propio límite de error', async () => {
    hook.value = { ...BASE, dashboard: await dashboardWith() };
    const found = boundaries(CohortDashboard());

    expect(found.map(({ props }) => props.label)).toEqual([
      'Alertas críticas pendientes',
      'Conducta y adherencia',
      'Progresión narrativa y gamificación',
      'Efectividad de notificaciones',
    ]);
    expect(found.map(({ props }) => props.children.type)).toEqual([
      CriticalAlertsCard,
      DashboardWidget,
      DashboardWidget,
      DashboardWidget,
    ]);
    expect(
      found.slice(1).map(({ props }) => props.children.props.Summary),
    ).toEqual([BehavioralSummary, NarrativeSummary, NotificationSummary]);
  });

  it('un error de presentación solo afecta a su sección y se puede reintentar', () => {
    const onRetry = vi.fn();
    expect(
      SectionErrorBoundary.getDerivedStateFromError(new Error('x')),
    ).toEqual({ failed: true });

    const boundary = new SectionErrorBoundary({
      label: 'Progresión narrativa y gamificación',
      description: 'Las demás secciones del panel no se ven afectadas.',
      onRetry,
    });
    boundary.state = { failed: true };
    boundary.setState = vi.fn();
    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain(
      'Progresión narrativa y gamificación: no se pudo mostrar',
    );
    expect(html).toContain(
      'Las demás secciones del panel no se ven afectadas.',
    );
    boundary.handleRetry();
    expect(boundary.setState).toHaveBeenCalledWith({ failed: false });
    expect(onRetry).toHaveBeenCalled();
  });

  it('el límite de error de RF-149 conserva su comportamiento sin las nuevas opciones', () => {
    const boundary = new SectionErrorBoundary({
      label: 'Historial de alertas',
    });
    boundary.state = { failed: true };
    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain(
      'Las demás secciones de la ficha no se ven afectadas.',
    );
    expect(html).not.toContain('Reintentar');
  });
});

describe('Panel principal (RF-140): indicadores gráficos', () => {
  const widths = (html) =>
    [...html.matchAll(/style="width:([\d.]+)%"/g)].map(([, w]) => Number(w));

  it('las barras comparan las cantidades originales y muestran el número, no un porcentaje', () => {
    const html = renderToStaticMarkup(
      <BarList
        label="Prueba"
        items={[
          { key: 'a', label: 'Inicio', value: 4 },
          { key: 'b', label: 'Desarrollo', value: 8 },
          { key: 'c', label: 'Cierre', value: 0 },
        ]}
      />,
    );

    expect(widths(html)).toEqual([50, 100, 0]);
    expect(textOf(html)).toMatch(/Inicio 4 .*Desarrollo 8 .*Cierre 0/);
    expect(textOf(html)).not.toContain('%');
    expect(html.match(/aria-hidden="true" data-bar/g)).toHaveLength(3);
  });

  it('una cantidad ausente no dibuja barra y se muestra «No disponible»', () => {
    const html = renderToStaticMarkup(
      <BarList
        label="Prueba"
        items={[
          { key: 'a', label: 'Inicio', value: 3 },
          { key: 'b', label: 'Desarrollo', value: null },
        ]}
      />,
    );

    expect(widths(html)).toEqual([100]);
    expect(textOf(html)).toContain('Desarrollo No disponible');
    expect(html).toContain('border-dashed');
  });

  it('la tasa muestra su valor completo y un arco solo si está entre 0 y 1', () => {
    const html = renderToStaticMarkup(
      <dl>
        <RateGauge label="Tasa" value={0.5825} />
      </dl>,
    );

    expect(textOf(html)).toContain('Tasa 0,5825');
    expect(html).toContain('data-gauge="scale"');
    expect(html).toMatch(/stroke-dashoffset="41\.75/);
    expect(textOf(html)).not.toContain('%');
  });

  it('una tasa null o no calculable no representa una proporción de cero', () => {
    for (const value of [null, 'NO_CALCULABLE', undefined]) {
      const html = renderToStaticMarkup(
        <dl>
          <RateGauge label="Tasa" value={value} />
        </dl>,
      );

      expect(textOf(html)).toContain('Tasa No disponible');
      expect(html).toContain('data-gauge="none"');
      expect(html).not.toContain('stroke-dashoffset');
    }
  });

  it('el valor de cada tasa se lee en una sola línea, sin partir dígitos', () => {
    const html = renderToStaticMarkup(
      <NotificationSummary
        data={{
          averageOpenRate: 0.5825,
          averageConversionRate: 0.3125,
          sentNotifications: 412,
          deliveredNotifications: 398,
          discardedNotifications: 21,
          updatedAt: null,
        }}
      />,
    );
    const values = [
      ...html.matchAll(
        /<span data-rate-value="[^"]*" class="([^"]*)">([^<]*)</g,
      ),
    ];

    expect(values.map(([, , value]) => value)).toEqual(['0,5825', '0,3125']);
    for (const [, className] of values) {
      expect(className).toContain('whitespace-nowrap');
      expect(className).not.toMatch(/break-(all|words)/);
    }
    // Texto estático de solo lectura: sin controles ni contenedores con
    // desplazamiento (la causa de las flechas junto a las tasas).
    expect(html).not.toMatch(/<input|role="spinbutton"|contenteditable/i);
    expect(html).not.toMatch(/overflow-(x-|y-)?(auto|scroll)/);
    // El diseño depende del ancho del widget, no de la ventana.
    expect(html).toMatch(/^<div class="@container">/);
    expect(html).toContain('@lg:grid-cols-2');
    expect(html).toContain('@4xl:flex-row');
  });

  it('una tasa fuera de 0 a 1 se muestra sin arco', () => {
    const html = renderToStaticMarkup(
      <dl>
        <RateGauge label="Tasa" value={1.5} />
      </dl>,
    );

    expect(textOf(html)).toContain('Tasa 1,5');
    expect(html).toContain('data-gauge="none"');
    expect(html).toContain('fuera de la escala 0 a 1');
  });

  it('la adherencia se muestra con su valor original, sin anillo ni barra', () => {
    const html = renderToStaticMarkup(
      <BehavioralSummary
        data={{
          activeUsers: 18,
          averageAdherence: 0.7342,
          progressDistribution: null,
          pendingInactivityAlerts: 2,
          pendingCravingAlerts: 1,
          updatedAt: null,
        }}
      />,
    );

    expect(textOf(html)).toContain('Adherencia promedio 0,7342');
    expect(html).not.toContain('data-gauge');
    expect(html).not.toContain('data-bar');
    expect(textOf(html)).toContain('Distribución no disponible');
  });

  it('cero envíos con tasas null: totales en 0 y tasas «No disponible»', () => {
    const text = textOf(
      renderToStaticMarkup(
        <NotificationSummary
          data={{
            averageOpenRate: null,
            averageConversionRate: null,
            sentNotifications: 0,
            deliveredNotifications: 0,
            discardedNotifications: 0,
            updatedAt: null,
          }}
        />,
      ),
    );

    expect(text).toContain('Tasa de apertura promedio No disponible');
    expect(text).toContain('Enviadas 0');
  });
});

describe('Panel principal (RF-140): estados de los widgets', () => {
  const widget = (result) =>
    renderToStaticMarkup(
      <MemoryRouter>
        <DashboardWidget
          id="w"
          title="Progresión narrativa y gamificación"
          icon={() => null}
          dimension="progresión narrativa"
          moduleLabel="gamificación"
          result={result}
          isLoading={false}
          detailPath="/detalle"
          detailLabel="Ver detalle"
          onRetry={() => {}}
          isDemo={false}
          Summary={NarrativeSummary}
        />
      </MemoryRouter>,
    ).replaceAll('<!-- -->', '');

  const responded = (view) => ({
    section: SEC.NARRATIVE,
    outcome: 'RESPONDED',
    view,
  });
  const DATA = {
    phaseDistribution: [
      { phase: 'INICIO', users: 4 },
      { phase: 'DESARROLLO', users: 9 },
      { phase: 'CIERRE', users: 3 },
    ],
    cohortUsers: null,
    completedProgramUsers: 2,
    usersWithAchievements: 13,
    unlockedAchievements: 41,
    updatedAt: null,
  };

  it('sin consolidar: estado funcional, sin alerta ni reintento', () => {
    const html = widget(
      responded({
        status: 'NOT_CONSOLIDATED',
        data: null,
        message: 'Sin progresión consolidada.',
      }),
    );

    expect(html).toContain('Aún sin datos consolidados');
    expect(html).toContain('Sin progresión consolidada.');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Reintentar');
  });

  it('desactualizada: marca y fecha del último registro', () => {
    const html = widget(
      responded({
        status: 'STALE',
        data: DATA,
        lastAvailableAt: '2026-11-20T11:30:00Z',
      }),
    );

    expect(html).toContain('Estado de la vista: </span>Desactualizada');
    expect(textOf(html)).toContain(
      'Datos desactualizados: se muestra el último registro disponible',
    );
    expect(html).toContain('dateTime="2026-11-20T11:30:00Z"');
  });

  it('agregado suprimido: sin datos', () => {
    const html = widget(responded({ status: 'SUPPRESSED', data: null }));

    expect(html).toContain('Vista no mostrada por privacidad');
    expect(html).not.toContain('Logros desbloqueados');
  });

  it('no disponible sin vista anterior: con reintento', () => {
    const html = widget(responded({ status: 'UNAVAILABLE', data: null }));

    expect(html).toContain('no hay una vista anterior para mostrar');
    expect(html).toContain('Reintentar');
  });

  it('usuarios excluidos: el aviso de la fuente acompaña a los datos', () => {
    const text = textOf(
      widget(
        responded({
          status: 'READY',
          data: DATA,
          message: 'Algunos usuarios no cuentan con perfil narrativo activo.',
        }),
      ),
    );

    expect(text).toContain(
      'Aviso del módulo de gamificación: Algunos usuarios no cuentan con perfil narrativo activo.',
    );
    expect(text).toMatch(/Inicio 4 .*Desarrollo 9 .*Cierre 3/);
  });
});

describe('Panel principal (RF-140): accesibilidad y movimiento', () => {
  it('cada widget es una sección con encabezado h2', async () => {
    const html = render({ dashboard: await dashboardWith() });

    for (const id of [
      'alertas-criticas-titulo',
      'panel-conducta-titulo',
      'panel-narrativa-titulo',
      'panel-notificaciones-titulo',
    ]) {
      expect(html).toContain(`aria-labelledby="${id}"`);
      expect(html).toMatch(new RegExp(`<h2 id="${id}"`));
    }
  });

  it('la información secundaria se despliega con un control nativo y táctil', async () => {
    const html = render({ dashboard: await dashboardWith() });

    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html).toMatch(/<summary class="[^"]*min-h-\[44px\]/);
  });

  it('todas las animaciones se desactivan con movimiento reducido', async () => {
    const html = render({ dashboard: await dashboardWith() });
    const animated = [...html.matchAll(/class="([^"]*starting:[^"]*)"/g)].map(
      ([, className]) => className,
    );

    expect(animated.length).toBeGreaterThan(0);
    for (const className of animated) {
      expect(className).toContain('motion-reduce:transition-none');
    }
    expect(html).not.toMatch(/animate-(spin|bounce|ping)/);
  });
});
