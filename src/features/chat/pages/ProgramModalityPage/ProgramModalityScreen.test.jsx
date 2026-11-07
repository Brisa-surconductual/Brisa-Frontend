import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { initialProgramModalityState } from './utils/programModalityState.js';
import { ProgramModalityScreen } from './ProgramModalityScreen.jsx';

let screenState;

vi.mock('./hooks/useProgramModalityScreen.js', () => ({
  useProgramModalityScreen: () => screenState,
}));

vi.mock('@/app/providers/index.js', () => ({
  useAuth: () => ({ logout: () => {} }),
}));

const elegibilidad = {
  id_programa: 1,
  modalidad_actual: 'GRUPAL',
  total_usuarios_activos: 10,
  con_perfil_completo: 10,
  sin_perfil_completo: 0,
  elegible: true,
};

function render(state) {
  screenState = {
    ...initialProgramModalityState,
    enableModality: () => {},
    ...state,
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <ProgramModalityScreen />
    </MemoryRouter>,
  );
}

describe('ProgramModalityScreen (RF-25B)', () => {
  it('cargando muestra la consulta y no habilita nada', () => {
    const html = render({});

    expect(html).toContain('Consultando elegibilidad del programa');
    expect(html).not.toContain('Habilitar');
  });

  it('un programa elegible muestra las cifras reales y permite habilitar', () => {
    const html = render({ status: 'ready', eligibility: elegibilidad });

    expect(html).toContain('GRUPAL');
    expect(html).toContain('10');
    expect(html).toContain('Habilitar');
    expect(html).not.toContain('Integración pendiente');
  });

  it('un programa no elegible no ofrece habilitar', () => {
    const html = render({
      status: 'ready',
      eligibility: {
        ...elegibilidad,
        con_perfil_completo: 7,
        sin_perfil_completo: 3,
        elegible: false,
      },
    });

    expect(html).toContain('7');
    expect(html).not.toMatch(/<button[^>]*>[^<]*Habilitar personalizada/);
  });

  it('un error de consulta muestra el mensaje del backend', () => {
    const html = render({ status: 'error', loadError: 'Sin permisos.' });

    expect(html).toContain(
      'No fue posible consultar la elegibilidad del programa.',
    );
    expect(html).toContain('Sin permisos.');
  });
});
