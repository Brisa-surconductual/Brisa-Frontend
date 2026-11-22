import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { TaxonomyVariablePicker } from '../../components/TaxonomyVariablePicker/index.js';
import {
  initialTaxonomyState,
  taxonomyReducer,
} from './utils/taxonomyVariablesState.js';
import { TaxonomyVariablesPage } from './TaxonomyVariablesPage.jsx';

const VARIABLES = [
  {
    codigo: 'NIVEL_CRAVING',
    nombre: 'Nivel de craving',
    descripcion: 'Intensidad del deseo de vapear.',
    tipo_valor: 'ENTERO',
    valores: null,
    tipos_entrada_permitidos: ['ESCALA', 'NUMERICO'],
    etiquetas: [{ min: 4, max: 6, etiqueta: 'CRAVING_MODERADO' }],
    habilitada: true,
    en_uso_publicado: true,
  },
  {
    codigo: 'SITUACION_RIESGO',
    nombre: 'Situación de riesgo',
    descripcion: null,
    tipo_valor: 'BOOLEANO',
    valores: null,
    tipos_entrada_permitidos: ['BOOLEANO'],
    etiquetas: { true: 'RIESGO_PRESENTE', false: 'RIESGO_AUSENTE' },
    habilitada: false,
    en_uso_publicado: false,
  },
];

const hook = vi.hoisted(() => ({ estado: null }));
vi.mock('./hooks/useTaxonomyVariablesPage.js', () => ({
  useTaxonomyVariablesPage: () => hook.estado,
}));

function render(estado) {
  hook.estado = {
    ...initialTaxonomyState,
    retry: vi.fn(),
    openCreate: vi.fn(),
    closeCreate: vi.fn(),
    changeCreate: vi.fn(),
    submitCreate: vi.fn(),
    askToggle: vi.fn(),
    cancelToggle: vi.fn(),
    confirmToggle: vi.fn(),
    ...estado,
  };
  return renderToStaticMarkup(
    <MemoryRouter>
      <TaxonomyVariablesPage />
    </MemoryRouter>,
  );
}

describe('RF-30B TaxonomyVariablesPage', () => {
  it('lista las variables con versión, estado y etiquetas en tarjetas glass', () => {
    const html = render({
      status: 'ready',
      version: '1.2',
      variables: VARIABLES,
    });
    expect(html).toContain('Variables taxonómicas');
    expect(html).toContain('Versión 1.2');
    expect(html).toContain('Nivel de craving');
    expect(html).toContain('CRAVING_MODERADO');
    expect(html).toContain('--glass-bg');
    expect(html).toContain('Deshabilitada');
  });

  it('una variable en uso publicado no ofrece deshabilitar; una apagada ofrece habilitar', () => {
    const html = render({
      status: 'ready',
      version: '1.0',
      variables: VARIABLES,
    });
    expect(html).toContain('En uso por un flujo publicado');
    expect(html).toContain('Habilitar');
  });

  it('muestra el error de carga con reintento', () => {
    const html = render({ status: 'error', error: 'Sin conexión.' });
    expect(html).toContain('No se pudo cargar la taxonomía');
    expect(html).toContain('Reintentar');
  });

  it('la pestaña Variables aparece en la subnavegación del chat', () => {
    const html = render({ status: 'ready', variables: [] });
    expect(html).toContain('/app/administrativo/chat/variables');
  });
});

describe('RF-30B estado de la página', () => {
  it('cambiar el tipo de valor en la creación reinicia las entradas', () => {
    let s = taxonomyReducer(initialTaxonomyState, { type: 'CREATE_OPEN' });
    s = taxonomyReducer(s, {
      type: 'CREATE_CHANGE',
      field: 'tipoValor',
      value: 'CATEGORIA',
    });
    expect(s.creacion.values.tiposEntrada).toEqual([
      'OPCION_UNICA',
      'MULTISELECCION',
    ]);
  });

  it('guardar cierra el modal, avisa y recarga', () => {
    const s = taxonomyReducer(
      {
        ...initialTaxonomyState,
        creacion: { ...initialTaxonomyState.creacion, open: true },
      },
      { type: 'CREATE_SAVED', message: 'ok' },
    );
    expect(s.creacion.open).toBe(false);
    expect(s.notice).toBe('ok');
    expect(s.reloadKey).toBe(1);
  });
});

describe('RF-30B TaxonomyVariablePicker', () => {
  it('muestra los tipos permitidos y las etiquetas de la variable elegida', () => {
    const html = renderToStaticMarkup(
      <TaxonomyVariablePicker
        variables={VARIABLES}
        value="NIVEL_CRAVING"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('Variable que captura este nodo');
    expect(html).toContain('Escala numérica o Número');
    expect(html).toContain('4 a 6');
    expect(html).toContain('backdrop-blur-[var(--glass-blur)]');
  });
});
