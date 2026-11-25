import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ActiveAlertList } from '../../components/ActiveAlertList/index.js';
import { ConsumptionTrendBadge } from '../../components/ConsumptionTrendBadge/index.js';
import { ProfileIndicator } from '../../components/ProfileIndicator/index.js';
import { INDICATOR_STATE } from '../../types/participantTracking.js';
import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';
import { PROFILE_STATUS } from './hooks/useParticipantTrackingProfile.js';

const hook = vi.hoisted(() => ({ value: null, args: null }));
const historyHook = vi.hoisted(() => ({ value: null, args: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useParticipantTrackingProfile.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParticipantTrackingProfile: (args) => {
      hook.args = args;
      return hook.value ?? actual.useParticipantTrackingProfile(args);
    },
  };
});

// El historial (RF-129) también usa su hook real salvo que la prueba fije un estado.
vi.mock('./hooks/useAlertHistory.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAlertHistory: (args) => {
      historyHook.args = args;
      return historyHook.value ?? actual.useAlertHistory(args);
    },
  };
});

const available = (value) => ({ state: INDICATOR_STATE.AVAILABLE, value });

const PROFILE = Object.freeze({
  progress: available(62.5),
  adherence: available(70),
  trend: 'REDUCCION',
  activeAlerts: [
    { type: 'CRAVING_ELEVADO', generatedAt: '2026-03-08T02:15:00Z' },
    { type: 'INACTIVIDAD', generatedAt: '2026-03-05T07:30:00-05:00' },
  ],
  updatedAt: '2026-03-09T11:00:00Z',
});

const BASE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: 'X-1',
  profile: PROFILE,
  status: PROFILE_STATUS.READY,
  isLoading: false,
  isDemo: true,
  isIntegrationPending: false,
  headingRef: { current: null },
  retry: vi.fn(),
});

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

function render(changes, entry = '/app/administrativo/cohortes/c-1/seguimiento/ref-1') {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return clean(renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:referencia" element={<ParticipantTrackingProfilePage />} />
      </Routes>
    </MemoryRouter>,
  ));
}

afterEach(() => {
  hook.value = null;
  hook.args = null;
  historyHook.value = null;
  historyHook.args = null;
  vi.unstubAllEnvs();
});

describe('Ficha individual (RF-128): presentación', () => {
  it('pide la ficha con la cohorte y la referencia opaca de la ruta, y vuelve al listado', () => {
    const html = render({});

    expect(hook.args).toEqual({ cohortId: 'c-1', reference: 'ref-1' });
    expect(html).toContain('href="/app/administrativo/cohortes/c-1/seguimiento"');
    expect(textOf(html)).toContain('Volver al seguimiento');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });

  it('encabezado enfocable con el código seudonimizado y la cohorte', () => {
    const html = render({});

    expect(html).toMatch(/<h1[^>]*tabindex="-1"[^>]*>Ficha de seguimiento<span class="sr-only"> del participante<\/span><span[^>]*>X-1<\/span><\/h1>/);
    expect(textOf(html)).toContain('Cohorte «Cohorte de prueba».');
  });

  it('identifica la consulta como de solo lectura y los datos como demostración', () => {
    const text = textOf(render({}));

    expect(text).toContain('Información de solo lectura');
    expect(text).toContain('no pueden modificarse desde aquí');
    expect(text).toContain('Datos de demostración');
  });

  it('muestra progreso, adherencia, tendencia, alertas activas y la fecha de actualización', () => {
    const html = render({});
    const text = textOf(html);

    expect(text).toMatch(/Progreso 62,5 Valor principal/);
    expect(text).toMatch(/Adherencia 70 Valor principal/);
    expect(text).toMatch(/Tendencia de consumo Reducción/);
    expect(text).toMatch(/Alertas activas \(2\)/);
    expect(html).toContain('<time dateTime="2026-03-09T11:00:00Z">9 de mar de 2026, 06:00</time>');
  });

  it('no convierte los indicadores a porcentaje ni dibuja barras', () => {
    const html = render({});

    expect(textOf(html)).not.toMatch(/62,5 ?%|70 ?%/);
    expect(html).not.toContain('width:');
  });

  it('sin fecha de actualización lo indica', () => {
    expect(textOf(render({ profile: { ...PROFILE, updatedAt: null } }))).toContain('Fecha de actualización no disponible');
  });

  it('solo consulta: sin formularios, campos ni botones; ningún enlace aparte de volver', () => {
    const html = render({});

    expect(html).not.toMatch(/<form|<input|<select|<textarea|<button/);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(textOf(html)).not.toMatch(/Editar|Eliminar|Exportar|Marcar como atendida|Resolver|Descartar\b|Atender/);
  });

  it('no muestra datos personales, internos ni contenido de diario o chat', () => {
    const html = render({});

    expect(html).not.toMatch(/@|demo-participante|uuid|ref-1"|diario|chat|craving \d/i);
  });
});

describe('Indicadores, tendencias y alertas', () => {
  const indicator = (value) => clean(renderToStaticMarkup(<dl><ProfileIndicator label="Progreso" description="d" indicator={value} /></dl>));

  it('indicador normal, ausente y no calculable', () => {
    expect(textOf(indicator(available(0)))).toContain('Progreso 0 d');
    expect(textOf(indicator({ state: INDICATOR_STATE.NOT_AVAILABLE, value: null }))).toContain('No disponible');
    expect(textOf(indicator({ state: INDICATOR_STATE.NOT_CALCULABLE, value: null }))).toContain('No calculable');
    expect(textOf(indicator(undefined))).toContain('No disponible');
  });

  it.each([
    ['REDUCCION', 'Reducción'],
    ['ESTABLE', 'Estable'],
    ['INCREMENTO', 'Incremento'],
    ['NO_CALCULADA', 'No calculada'],
  ])('tendencia %s: «%s», con ícono y tono neutro', (trend, label) => {
    const html = clean(renderToStaticMarkup(<ConsumptionTrendBadge trend={trend} />));

    expect(textOf(html).trim()).toBe(label);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain('var(--surface-hover)');
    expect(html).not.toMatch(/success|danger|warning/);
  });

  it('una tendencia desconocida no se interpreta ni se muestra cruda; una ausente, como no disponible', () => {
    const unknown = textOf(clean(renderToStaticMarkup(<ConsumptionTrendBadge trend="ESTABILIZACION" />)));

    expect(unknown).toContain('Valor no reconocido');
    expect(unknown).not.toContain('ESTABILIZACION');
    expect(textOf(clean(renderToStaticMarkup(<ConsumptionTrendBadge trend={null} />)))).toContain('No disponible');
  });

  it('alertas activas con tipo y fecha en hora de Colombia', () => {
    const html = clean(renderToStaticMarkup(<ActiveAlertList alerts={PROFILE.activeAlerts} />));

    expect(html.match(/<li/g)).toHaveLength(2);
    expect(textOf(html)).toContain('Craving elevado');
    expect(textOf(html)).toContain('Inactividad');
    expect(html).toContain('<time dateTime="2026-03-08T02:15:00Z">7 de mar de 2026, 21:15</time>');
  });

  it('sin alertas, con tipo desconocido, sin fecha o no disponibles', () => {
    expect(textOf(clean(renderToStaticMarkup(<ActiveAlertList alerts={[]} />)))).toContain('Sin alertas activas');
    expect(textOf(clean(renderToStaticMarkup(<ActiveAlertList alerts={[{ type: 'OTRA', generatedAt: '2026-03-08' }]} />)))).toMatch(/Tipo no reconocido .*Fecha no disponible/);
    expect(textOf(clean(renderToStaticMarkup(<ActiveAlertList alerts={null} />)))).toContain('No disponible');
  });
});

describe('Estados de la ficha', () => {
  it('cargando: aviso accesible y sin datos', () => {
    const html = render({ isLoading: true, status: null, profile: null, code: null });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando la ficha de seguimiento/);
    expect(html).not.toContain('id="indicadores-principales"');
  });

  it('sin perfil (204): muestra el código y el aviso, sin indicadores', () => {
    const html = render({ status: PROFILE_STATUS.NO_PROFILE, profile: null });

    expect(textOf(html)).toContain('X-1');
    expect(html).toMatch(/role="status"[\s\S]*No existe perfil de seguimiento disponible para el participante consultado\./);
    expect(html).not.toContain('id="indicadores-principales"');
  });

  it.each([
    [PROFILE_STATUS.DENIED, 'No tiene permisos para consultar perfiles de seguimiento individuales.', false],
    [PROFILE_STATUS.NOT_FOUND, 'El participante seleccionado no existe.', false],
    [PROFILE_STATUS.COHORT_NOT_FOUND, 'La cohorte solicitada no existe en el sistema.', false],
    [PROFILE_STATUS.OUTSIDE_COHORT, 'El participante ya no pertenece a esta cohorte.', false],
    [PROFILE_STATUS.INCONSISTENT, 'La información de seguimiento no corresponde al participante solicitado.', true],
    [PROFILE_STATUS.UNAVAILABLE, 'El módulo de seguimiento no se encuentra disponible en este momento.', true],
    [PROFILE_STATUS.ERROR, 'No fue posible cargar el perfil de seguimiento individual.', true],
  ])('%s: alerta, sin código ni indicadores', (status, message, retry) => {
    const html = render({ status, code: null, profile: null });

    expect(html).toMatch(/role="alert"/);
    expect(textOf(html)).toContain(message);
    expect(html).not.toMatch(/id="indicadores-principales"|X-1/);
    expect(html.includes('Reintentar')).toBe(retry);
  });

  it('acceso denegado en demostración: aclara que es simulado', () => {
    expect(textOf(render({ status: PROFILE_STATUS.DENIED, code: null, profile: null }))).toContain('Resultado simulado por la fuente de demostración');
  });

  it('integración pendiente: sin datos, sin aviso de demo ni de solo lectura', () => {
    const html = render({ isIntegrationPending: true, isDemo: false, status: null, code: null, profile: null });

    expect(html).toMatch(/role="status"[\s\S]*Información aún no disponible/);
    expect(html).not.toMatch(/Datos de demostración|Información de solo lectura|id="indicadores-principales"/);
  });

  it('con el hook real y sin modo demo, muestra la integración pendiente', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');

    expect(render(null)).toContain('Información aún no disponible');
  });
});
