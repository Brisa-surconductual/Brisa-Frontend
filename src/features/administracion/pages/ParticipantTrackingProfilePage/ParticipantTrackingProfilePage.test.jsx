import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ActiveAlertList } from '../../components/ActiveAlertList/index.js';
import { ConsumptionTrendBadge } from '../../components/ConsumptionTrendBadge/index.js';
import { ProfileIndicator } from '../../components/ProfileIndicator/index.js';
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

const CODE = 'P-7F3A91C2';

const PROFILE = Object.freeze({
  progressLevel: 'EN_AVANCE',
  completedUnits: 4,
  adherence: 0.41,
  daysWithRecord: 10,
  trend: 'REDUCCION',
  activeAlerts: [
    { id: 'a-1', type: 'CRAVING_ELEVADO', generatedAt: '2026-03-08T02:15:00Z', status: 'ACTIVA' },
    { id: 'a-2', type: 'INACTIVIDAD', generatedAt: '2026-03-05T07:30:00-05:00', status: 'ATENDIDA' },
  ],
  updatedAt: '2026-03-09T11:00:00Z',
});

const BASE = Object.freeze({
  cohort: { id: 'c-1', name: 'Cohorte de prueba' },
  code: CODE,
  profile: PROFILE,
  status: PROFILE_STATUS.READY,
  isLoading: false,
  isDemo: false,
  headingRef: { current: null },
  retry: vi.fn(),
});

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

function render(changes, entry = `/app/administrativo/cohortes/c-1/seguimiento/${CODE}`) {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return clean(renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte/seguimiento/:codigoParticipante" element={<ParticipantTrackingProfilePage />} />
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
  it('pide la ficha con la cohorte y el código auténtico de la ruta, y vuelve al listado', () => {
    const html = render({});

    expect(hook.args).toEqual({ cohortId: 'c-1', participantCode: CODE });
    expect(html).toContain('href="/app/administrativo/cohortes/c-1/seguimiento"');
    expect(textOf(html)).toContain('Volver al seguimiento');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  });

  it('encabezado enfocable con el código seudonimizado y la cohorte', () => {
    const html = render({});

    expect(html).toMatch(new RegExp(`<h1[^>]*tabindex="-1"[^>]*>Ficha de seguimiento<span class="sr-only"> del participante</span><span[^>]*>${CODE}</span></h1>`));
    expect(textOf(html)).toContain('Cohorte «Cohorte de prueba».');
  });

  it('identifica la consulta como de solo lectura; en la API no hay aviso de demostración', () => {
    const text = textOf(render({}));

    expect(text).toContain('Información de solo lectura');
    expect(text).toContain('no pueden modificarse desde aquí');
    expect(text).not.toContain('Datos de demostración');
    expect(textOf(render({ isDemo: true }))).toContain('Datos de demostración');
  });

  it('nivel de progreso como categoría, adherencia en %, tendencia, alertas activas con estado y fecha', () => {
    const html = render({});
    const text = textOf(html);

    expect(text).toMatch(/Nivel de progreso En avance 4 unidades completadas/);
    expect(text).toMatch(/Tasa de adherencia 41 % 10 días con registro/);
    expect(text).toMatch(/Tendencia de consumo Reducción/);
    expect(text).toMatch(/Alertas activas \(2\)/);
    expect(text).toMatch(/Craving elevado Estado de resolución: Activa/);
    expect(text).toMatch(/Inactividad Estado de resolución: Atendida/);
    expect(html).toContain('<time dateTime="2026-03-09T11:00:00Z">9 de mar de 2026, 06:00</time>');
  });

  it('no infiere un porcentaje a partir del nivel categórico', () => {
    expect(textOf(render({}))).not.toMatch(/En avance \d+ ?%|\d+ ?% de progreso/);
  });

  it('sin fecha de actualización lo indica', () => {
    expect(textOf(render({ profile: { ...PROFILE, updatedAt: null } }))).toContain('Fecha de actualización no disponible');
  });

  it('solo consulta: sin formularios ni campos; solo el botón de exportar y los enlaces de volver y sesiones', () => {
    const html = render({});

    expect(html).not.toMatch(/<form|<input|<select|<textarea/);
    // RF-145: el único botón es la exportación CSV, que solo lee.
    expect((html.match(/<button[\s\S]*?<\/button>/g) ?? []).map((button) => textOf(button).trim()))
      .toEqual(['Exportar CSV del historial de seguimiento']);
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(textOf(html)).not.toMatch(/Editar|Eliminar|Marcar como atendida|Resolver|Descartar\b|Atender/);
  });

  it('no muestra datos personales, internos ni contenido de diario o chat', () => {
    const html = render({});

    expect(textOf(html)).not.toMatch(/@|demo-participante|uuid|seg-|diario del|craving \d/i);
    expect(html).not.toContain('a-1');
  });

  it('en la API las demás secciones se indican como no disponibles, sin ocultar el perfil', () => {
    const html = render({});

    expect(html).toContain('id="indicadores-principales"');
    expect(textOf(html)).toContain('Otras secciones aún no disponibles');
    expect(html).not.toMatch(/id="historial-alertas"|id="progresion-narrativa"/);
    expect(historyHook.args).toMatchObject({ enabled: false });
  });
});

describe('Indicadores, tendencias y alertas', () => {
  const indicator = (props) => clean(renderToStaticMarkup(<dl><ProfileIndicator label="Nivel de progreso" description="d" {...props} /></dl>));

  it('indicador con valor y detalle, y sin dato como no disponible (nunca 0)', () => {
    expect(textOf(indicator({ value: 'Inicial', detail: '0 unidades completadas' }))).toContain('Nivel de progreso Inicial 0 unidades completadas d');
    expect(textOf(indicator({ value: null }))).toContain('No disponible');
    expect(textOf(indicator({ value: '0 %' }))).toContain('0 %');
  });

  it('sin indicadores en el perfil: no disponibles', () => {
    const text = textOf(render({ profile: { ...PROFILE, progressLevel: null, completedUnits: null, adherence: null, daysWithRecord: null } }));

    expect(text).toMatch(/Nivel de progreso No disponible/);
    expect(text).toMatch(/Tasa de adherencia No disponible/);
    expect(text).not.toMatch(/0 %|unidades completadas|días con registro/);
  });

  it('nivel desconocido: no se muestra crudo', () => {
    const text = textOf(render({ profile: { ...PROFILE, progressLevel: 'EXPERTO' } }));

    expect(text).toContain('Nivel no reconocido');
    expect(text).not.toContain('EXPERTO');
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

  it('alertas activas con tipo, estado y fecha en hora de Colombia', () => {
    const html = clean(renderToStaticMarkup(<ActiveAlertList alerts={PROFILE.activeAlerts} />));

    expect(html.match(/<li/g)).toHaveLength(2);
    expect(textOf(html)).toContain('Craving elevado');
    expect(textOf(html)).toContain('Atendida');
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

    expect(textOf(html)).toContain(CODE);
    expect(html).toMatch(/role="status"[\s\S]*No existe perfil de seguimiento disponible para el participante consultado\./);
    expect(html).not.toContain('id="indicadores-principales"');
  });

  it.each([
    [PROFILE_STATUS.INVALID_CODE, 'El identificador del participante no es válido.', false],
    [PROFILE_STATUS.DENIED, 'No tiene permisos para consultar perfiles de seguimiento individuales.', false],
    [PROFILE_STATUS.NOT_FOUND, 'El participante seleccionado no existe.', false],
    [PROFILE_STATUS.COHORT_NOT_FOUND, 'La cohorte solicitada no existe en el sistema.', false],
    [PROFILE_STATUS.OUTSIDE_COHORT, 'El participante no es un miembro activo de esta cohorte.', false],
    [PROFILE_STATUS.INCONSISTENT, 'La información de seguimiento no corresponde al participante solicitado.', true],
    [PROFILE_STATUS.UNAVAILABLE, 'El módulo de seguimiento no se encuentra disponible en este momento.', true],
    [PROFILE_STATUS.ERROR, 'No fue posible cargar el perfil de seguimiento individual.', true],
  ])('%s: alerta, sin código, indicadores, exportación ni otras secciones', (status, message, retry) => {
    const html = render({ status, code: null, profile: null });

    expect(html).toMatch(/role="alert"/);
    expect(textOf(html)).toContain(message);
    expect(html).not.toMatch(new RegExp(`id="indicadores-principales"|<span[^>]*>${CODE}</span>|Exportar CSV|Otras secciones`));
    expect(html.includes('Reintentar')).toBe(retry);
  });

  it('acceso denegado en demostración: aclara que es simulado', () => {
    expect(textOf(render({ isDemo: true, status: PROFILE_STATUS.DENIED, code: null, profile: null }))).toContain('Resultado simulado por la fuente de demostración');
    expect(textOf(render({ status: PROFILE_STATUS.DENIED, code: null, profile: null }))).not.toContain('simulado');
  });

  it('sesión vencida (401): lleva al inicio de sesión sin pintar la ficha', () => {
    expect(render({ status: PROFILE_STATUS.SESSION_REQUIRED, code: null, profile: null })).toBe('');
  });

  it('con el hook real en la API: cargando, sin demostración ni datos', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');
    const html = render(null);

    expect(html).toContain('Cargando la ficha de seguimiento');
    expect(html).not.toMatch(/Datos de demostración|id="indicadores-principales"/);
  });
});
