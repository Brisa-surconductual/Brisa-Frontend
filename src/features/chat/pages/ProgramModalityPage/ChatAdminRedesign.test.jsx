import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { PersonalizedTreesPage } from '../PersonalizedTreesPage/PersonalizedTreesPage.jsx';
import { ProgramModalityPage } from './ProgramModalityPage.jsx';

vi.mock('@/app/providers/index.js', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

const MODALITY = '/app/administrativo/chat/modalidad';
const TREES = '/app/administrativo/chat/arboles';

const render = (node, path = MODALITY) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>,
  ).replaceAll('<!-- -->', '');

const ELIGIBLE = Object.freeze({
  modalidad_actual: 'GRUPAL',
  total_usuarios_activos: 4,
  con_perfil_completo: 4,
  sin_perfil_completo: 0,
  elegible: true,
});

const enableButton = (html) =>
  html.match(
    /<button[^>]*>(?:(?!<\/button>)[\s\S])*Habilitar modalidad personalizada<\/button>/,
  )?.[0];

describe('Modalidad del chat', () => {
  it('sin datos de elegibilidad lo indica, sin cifras ni habilitación', () => {
    const html = render(<ProgramModalityPage />);

    expect(html).toContain('Información no disponible');
    expect(html).not.toMatch(/backend|Integración pendiente/);
    expect(html).toContain('Sin información del programa');
    expect(html).not.toContain('Modalidad conversacional');
    expect(html).not.toContain('role="progressbar"');
    expect(enableButton(html)).toBeUndefined();
    expect(html).not.toContain('Selecciona un programa');
  });

  it('conserva un único h1, sin <main> propio, y la subnavegación con la sección activa', () => {
    const html = render(<ProgramModalityPage />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(html).toContain('aria-label="Secciones del módulo Chat"');
    expect(html).toMatch(
      /aria-current="page"[^>]*href="\/app\/administrativo\/chat\/modalidad"|href="\/app\/administrativo\/chat\/modalidad"[^>]*aria-current="page"/,
    );
    expect(html).toMatch(
      /href="\/app\/administrativo"[^>]*min-h-\[44px\]|min-h-\[44px\][^>]*href="\/app\/administrativo"/,
    );
  });

  it('muestra la carga y el error como estados distintos de la ausencia de datos', () => {
    const loading = render(<ProgramModalityPage isLoading />);
    const failed = render(<ProgramModalityPage error={new Error('x')} />);

    expect(loading).toMatch(
      /role="status"[^>]*>Consultando elegibilidad del programa/,
    );
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toContain('Información no disponible');
    expect(failed).toMatch(
      /role="alert"[\s\S]*No fue posible consultar la elegibilidad del programa/,
    );
    expect(failed).not.toContain('Información no disponible');
  });

  it('con datos elegibles y acción integrada conserva las condiciones y habilita el botón', () => {
    const html = render(
      <ProgramModalityPage eligibility={ELIGIBLE} onEnableModality={vi.fn()} />,
    );

    expect(html).toContain('Modalidad conversacional');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain(
      'El programa tiene participantes activos: <strong>Cumple</strong>',
    );
    expect(html).toContain(
      'El programa cumple las condiciones para la transición.',
    );
    expect(enableButton(html)).not.toMatch(/disabled=""/);
    expect(html).toContain('<dialog');
    expect(html).toContain('Confirmar transición de modalidad');
  });

  it('sin la acción integrada o sin elegibilidad el botón queda deshabilitado', () => {
    const withoutAction = render(
      <ProgramModalityPage eligibility={ELIGIBLE} />,
    );
    const notEligible = render(
      <ProgramModalityPage
        eligibility={{
          ...ELIGIBLE,
          con_perfil_completo: 3,
          sin_perfil_completo: 1,
          elegible: false,
        }}
        onEnableModality={vi.fn()}
      />,
    );

    expect(enableButton(withoutAction)).toMatch(/disabled=""/);
    expect(enableButton(notEligible)).toMatch(/disabled=""/);
    expect(notEligible).toContain('Perfiles clínicos incompletos');
    expect(notEligible).toContain(
      'Todos los participantes tienen perfil completo: <strong>No cumple</strong>',
    );
  });
});

describe('Árboles conversacionales', () => {
  it('distingue datos no recibidos (null) de una lista vacía confirmada ([])', () => {
    const notReceived = render(<PersonalizedTreesPage trees={null} />, TREES);
    const empty = render(<PersonalizedTreesPage trees={[]} />, TREES);

    expect(notReceived).toContain(
      'No se recibió la información de los árboles conversacionales.',
    );
    expect(notReceived).not.toContain('Sin versiones');
    expect(empty).not.toContain('No se recibió la información');
    expect(empty).not.toContain('Información no disponible');
    expect(empty).toContain('Sin versiones');
  });

  it('sin datos no inventa árboles y lo indica', () => {
    const html = render(<PersonalizedTreesPage />, TREES);

    expect(html).toContain('Información no disponible');
    expect(html).not.toMatch(/backend|Integración pendiente/);
    expect(html).toContain(
      'Los árboles estarán disponibles cuando se consulte la información del',
    );
    expect(html).not.toContain('Versión');
    expect(html).not.toContain('Abstinencia física');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(
      /aria-current="page"[^>]*href="\/app\/administrativo\/chat\/arboles"|href="\/app\/administrativo\/chat\/arboles"[^>]*aria-current="page"/,
    );
  });

  it('distingue carga y error', () => {
    expect(render(<PersonalizedTreesPage isLoading />, TREES)).toMatch(
      /role="status"[^>]*>Consultando árboles conversacionales/,
    );
    expect(render(<PersonalizedTreesPage error="x" />, TREES)).toMatch(
      /role="alert"[\s\S]*No fue posible consultar los árboles conversacionales/,
    );
  });

  it('con datos muestra la última versión de cada combinación y las faltantes como sin crear', () => {
    const trees = [
      {
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'POSITIVO',
        version: 1,
        estado: 'BORRADOR',
        nombre: 'Árbol v1',
        nodos: [],
      },
      {
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'POSITIVO',
        version: 2,
        estado: 'PUBLICADO',
        nombre: 'Árbol v2',
        nodos: [{}, {}],
      },
    ];
    const html = render(<PersonalizedTreesPage trees={trees} />, TREES);

    expect(html).not.toContain('Información no disponible');
    expect(html.match(/<li/g)).toHaveLength(4);
    expect(html).toContain('Árbol v2');
    expect(html).not.toContain('Árbol v1');
    expect(html).toContain('Versión 2');
    expect(html).toContain('2 nodos');
    expect(html).toContain('<span class="sr-only">Estado: </span>PUBLICADO');
    expect(html.match(/SIN CREAR/g)).toHaveLength(3);
  });
});
