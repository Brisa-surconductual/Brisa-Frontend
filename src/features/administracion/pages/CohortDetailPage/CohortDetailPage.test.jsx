import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DEMO_COHORTS } from '../../data/cohortDemoData.js';
import { DEMO_PARTICIPANTS } from '../../data/participantDemoData.js';
import { countParticipantsByStatus } from '../../services/participantSummary.js';
import { CohortDetailPage } from './CohortDetailPage.jsx';

const hook = vi.hoisted(() => ({ value: null, args: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useCohortDetail.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCohortDetail: (args) => {
      hook.args = args;
      return hook.value ?? actual.useCohortDetail(args);
    },
  };
});

const BASE = Object.freeze({
  cohort: null,
  participants: [],
  participationCounts: countParticipantsByStatus([]),
  isLoading: false,
  loadError: '',
  notFound: false,
  participantsError: '',
  isDemo: false,
  isIntegrationPending: false,
  retry: vi.fn(),
});

const COHORT_B = DEMO_COHORTS[1];
const PARTICIPANTS_B = DEMO_PARTICIPANTS.filter(({ cohortId }) => cohortId === COHORT_B.id);

function render(changes, entry = `/app/administrativo/cohortes/${COHORT_B.id}`) {
  hook.value = changes ? { ...BASE, ...changes } : null;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/app/administrativo/cohortes/:idCohorte" element={<CohortDetailPage />} />
      </Routes>
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, '');

function withParticipants(participants = PARTICIPANTS_B, cohort = COHORT_B) {
  return render({
    cohort,
    participants,
    participationCounts: countParticipantsByStatus(participants),
    isDemo: true,
  });
}

function cardOf(html, code) {
  const start = html.indexOf(code);
  return html.slice(html.lastIndexOf('<article', start), html.indexOf('</article>', start));
}

afterEach(() => {
  hook.value = null;
  hook.args = null;
  vi.unstubAllEnvs();
});

describe('Detalle de cohorte (RF-125)', () => {
  it('pide los datos con el identificador de la ruta', () => {
    render({}, '/app/administrativo/cohortes/demo-temporal-1');

    expect(hook.args).toEqual({ cohortId: 'demo-temporal-1' });
  });

  it('encabezado con el nombre, estado, resumen y regreso al listado', () => {
    const html = withParticipants();

    expect(html).toMatch(/<h1[^>]*>Cohorte Piloto B<\/h1>/);
    expect(html).toContain('<span class="sr-only">Estado: </span>Activa');
    expect(html).toContain('href="/app/administrativo/cohortes"');
    expect(html).toContain('Volver a cohortes');
    expect(html).toContain('<time dateTime="2026-03-02">');
    expect(html).toContain('Cronograma demostrativo 1');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('lista un participante por tarjeta con su código y el resumen por estado', () => {
    const html = withParticipants();

    expect(html.match(/<article/g)).toHaveLength(6);
    for (const { code } of PARTICIPANTS_B) expect(html).toContain(code);
    expect(textOf(html)).toContain(
      '6 participantes · 2 activos · 3 pendientes de validación · 1 inactivo',
    );
  });

  it.each([
    ['PART-0001', 'Activo'],
    ['PART-0003', 'Pendiente de validación'],
    ['PART-0006', 'Inactivo'],
  ])('%s muestra su estado «%s» con texto e ícono', (code, label) => {
    const card = cardOf(withParticipants(), code);

    expect(card).toContain(`<span class="sr-only">Estado en la cohorte: </span>${label}`);
    expect(card).toContain('<svg');
  });

  it('presenta registro, consentimiento y línea base tal como los informa la fuente', () => {
    const html = withParticipants();
    const complete = textOf(cardOf(html, 'PART-0001'));
    const incomplete = textOf(cardOf(html, 'PART-0004'));
    const pending = textOf(cardOf(html, 'PART-0005'));

    expect(complete).toMatch(/RegistroCompleto.*Consentimiento informadoAceptado.*Línea baseRegistrada/);
    expect(incomplete).toMatch(/RegistroIncompleto.*Consentimiento informadoNo aceptado.*Línea basePendiente/);
    expect(pending).toMatch(/RegistroPendiente.*Consentimiento informadoPendiente.*Línea basePendiente/);
  });

  it('muestra los motivos de validación pendiente como lista accesible', () => {
    const card = cardOf(withParticipants(), 'PART-0004');

    expect(card).toContain('Motivos de validación pendiente');
    expect(card).toContain('<li>Registro incompleto.</li>');
    expect(card).toContain('<li>Consentimiento informado no aceptado.</li>');
    expect(card).toContain('<li>Línea base no registrada.</li>');
  });

  it('un pendiente sin motivos lo dice sin inventarlos; un activo no muestra motivos', () => {
    const html = withParticipants();

    expect(cardOf(html, 'PART-0005')).toContain('La fuente de datos no indicó motivos.');
    expect(cardOf(html, 'PART-0001')).not.toContain('Motivos de validación pendiente');
  });

  it('no calcula el estado: un pendiente con todo completo sigue pendiente', () => {
    const html = withParticipants([
      {
        id: 'p-1',
        cohortId: COHORT_B.id,
        code: 'X-9',
        participationStatus: 'PENDIENTE_VALIDACION',
        registrationStatus: 'COMPLETO',
        consentStatus: 'ACEPTADO',
        baselineStatus: 'REGISTRADA',
        pendingReasons: [],
      },
    ]);

    expect(html).toContain('Pendiente de validación');
    expect(html).not.toContain('>Activo');
  });

  it('nunca muestra datos personales, clínicos ni identificadores internos', () => {
    const html = withParticipants([
      {
        id: 'id-interno-secreto',
        cohortId: COHORT_B.id,
        code: 'X-1',
        participationStatus: 'ACTIVO',
        registrationStatus: 'COMPLETO',
        consentStatus: 'ACEPTADO',
        baselineStatus: 'REGISTRADA',
        correoElectronico: 'persona@example.com',
        nombreCompleto: 'Nombre Apellido',
        documento: '123456789',
        consumoDiario: 'dato de consumo',
        tipoDependencia: 'perfil clínico',
        resultado: 'resultado clínico',
      },
    ]);

    for (const value of [
      'id-interno-secreto',
      'persona@example.com',
      'Nombre Apellido',
      '123456789',
      'dato de consumo',
      'perfil clínico',
      'resultado clínico',
    ]) {
      expect(html).not.toContain(value);
    }
    expect(html).toContain('Solo se muestran códigos seudonimizados y estados administrativos.');
  });

  it('sin código no recurre a otro identificador', () => {
    const html = withParticipants([{ id: 'p-oculto', cohortId: COHORT_B.id, participationStatus: 'ACTIVO' }]);

    expect(html).toContain('Código no disponible');
    expect(html).not.toContain('p-oculto');
    expect(textOf(html)).toContain('Sin información');
  });

  it('es solo de consulta: sin asignar, retirar ni editar participantes', () => {
    const html = withParticipants();

    expect(html).not.toMatch(/<button|<form|<input|<select/);
    expect(textOf(html)).not.toMatch(/Asignar|Retirar|Editar|Eliminar/);
  });

  it('identifica los datos ficticios como demostración', () => {
    expect(withParticipants()).toMatch(/role="note"[\s\S]*Datos de demostración[\s\S]*no corresponden a estudiantes reales/);
  });

  it('cohorte sin participantes: lo dice, sin tarjetas ni acciones de asignación', () => {
    const html = withParticipants([], DEMO_COHORTS[0]);

    expect(html).toMatch(/role="status"[\s\S]*Esta cohorte aún no tiene participantes/);
    expect(html).not.toContain('<article');
    expect(html).not.toContain('<button');
    expect(textOf(html)).toContain('0 participantes');
  });

  it('cohorte creada temporalmente: abre su detalle con la lista vacía', () => {
    const temporary = { id: 'demo-temporal-1', name: 'Cohorte temporal', status: 'BORRADOR', startDate: '2026-08-03', endDate: '2026-11-27' };
    const html = withParticipants([], temporary);

    expect(html).toMatch(/<h1[^>]*>Cohorte temporal<\/h1>/);
    expect(html).toContain('Esta cohorte aún no tiene participantes');
  });

  it('cohorte inexistente: aviso de no encontrada, sin resumen ni participantes', () => {
    const html = render({ notFound: true });

    expect(html).toMatch(/role="alert"[\s\S]*Cohorte no encontrada[\s\S]*La cohorte seleccionada no existe/);
    expect(html).toContain('Detalle de cohorte');
    expect(html).not.toContain('Participantes</h2>');
  });

  it('carga: aviso accesible, sin datos', () => {
    const html = render({ isLoading: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando cohorte y participantes/);
    expect(html).not.toContain('<article');
  });

  it('error de la cohorte: alerta con reintento, sin datos ficticios', () => {
    const html = render({ loadError: 'No pudimos cargar la cohorte. Intenta nuevamente.' });

    expect(html).toMatch(/role="alert"[\s\S]*Cohorte no disponible/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('<article');
  });

  it('error de participantes: conserva la cohorte, alerta con reintento y no dice «sin participantes»', () => {
    const html = render({
      cohort: COHORT_B,
      participantsError: 'No pudimos cargar los participantes de la cohorte. Intenta nuevamente.',
    });

    expect(html).toMatch(/<h1[^>]*>Cohorte Piloto B<\/h1>/);
    expect(html).toMatch(/role="alert"[\s\S]*Participantes no disponibles/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('Esta cohorte aún no tiene participantes');
    expect(textOf(html)).toContain('ParticipantesNo disponible');
  });

  it('integración pendiente: lo indica y no muestra datos ficticios', () => {
    const html = render({ isIntegrationPending: true });

    expect(html).toMatch(/role="status"[\s\S]*Integración pendiente/);
    expect(html).not.toContain('Datos de demostración');
    expect(html).not.toContain('<article');
    expect(html).not.toContain('PART-');
  });

  it('con el hook real y sin modo demo, muestra la integración pendiente', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');
    const html = render(null);

    expect(html).toContain('Integración pendiente');
    expect(html).not.toContain('PART-');
  });
});
