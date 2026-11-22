import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  configuracionReglaTransicion,
  VALORES_TRANSICION_VACIOS,
} from '../../services/transicionesAdmin.js';
import { initialTreeDetailState } from './utils/treeDetailState.js';
import { GroupTreeDetailPage } from './GroupTreeDetailPage.jsx';

let pageState;

vi.mock('./hooks/useGroupTreeDetailPage.js', () => ({
  useGroupTreeDetailPage: () => pageState,
}));

const arbol = {
  flujo: {
    id: 'f-1',
    nombre: 'Grupal base',
    estado: 'BORRADOR',
    version: 1,
  },
  nodos: [
    {
      id: 'a',
      tipoNodo: 'MENSAJE',
      texto: 'Bienvenido a Brisa.',
      esNodoInicial: true,
      orden: 1,
      etiqueta: '1. Bienvenido a Brisa.',
    },
    {
      id: 'b',
      tipoNodo: 'PREGUNTA',
      texto: '',
      esNodoInicial: false,
      orden: null,
      etiqueta: '2. (sin texto)',
    },
  ],
  transiciones: [
    {
      id: 't1',
      origenId: 'a',
      destinoId: 'b',
      origen: '1. Bienvenido a Brisa.',
      destino: '2. (sin texto)',
      operador: 'IGUALDAD',
      condicion: 'valor: Sí',
      ordenEvaluacion: 1,
    },
  ],
};

function render(state) {
  pageState = {
    ...initialTreeDetailState,
    retry: () => {},
    accionesEstado: [],
    solicitarCambioEstado: () => {},
    cancelarCambioEstado: () => {},
    confirmarCambioEstado: () => {},
    ...state,
  };
  // El hook calcula la configuración de la regla desde el nodo origen.
  pageState.configTransicion ??= configuracionReglaTransicion(
    pageState.arbol?.nodos.find(
      (nodo) => nodo.id === pageState.transitionEditor.values.idNodoOrigen,
    ),
  );

  return renderToStaticMarkup(
    <MemoryRouter>
      <GroupTreeDetailPage />
    </MemoryRouter>,
  );
}

describe('GroupTreeDetailPage (RF-25, vista del árbol)', () => {
  it('cargando: aviso accesible y enlace para volver', () => {
    const html = render({});

    expect(html).toContain('Consultando el árbol');
    expect(html).toContain('href="/app/administrativo/chat/grupal"');
  });

  it('muestra el flujo, sus nodos (con el inicial marcado) y sus transiciones', () => {
    const html = render({ status: 'ready', arbol });

    expect(html).toContain('Grupal base');
    expect(html).toContain('Borrador');
    expect(html).toContain('Bienvenido a Brisa.');
    expect(html).toContain('Nodo inicial');
    expect(html).toContain('Sin texto.');
    expect(html).toContain('Igualdad');
    expect(html).toContain('valor: Sí');
    expect(html).toContain('Evaluación 1');
  });

  it('un árbol vacío lo dice en nodos y en transiciones', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, nodos: [], transiciones: [] },
    });

    expect(html).toContain('Este flujo aún no tiene nodos.');
    expect(html).toContain('Este flujo aún no tiene transiciones.');
  });

  it('error: mensaje del backend y Reintentar', () => {
    const html = render({ status: 'error', error: 'El flujo no existe.' });

    expect(html).toContain('role="alert"');
    expect(html).toContain('El flujo no existe.');
    expect(html).toContain('Reintentar');
  });

  it('un flujo que no es borrador es de solo lectura: sin formulario ni botones de edición', () => {
    const html = render({ status: 'ready', arbol, canEdit: false });

    expect(html).not.toContain('<form');
    expect(html).not.toContain('Agregar nodo');
    expect(html).not.toContain('Editar');
  });

  it('un borrador permite agregar y editar nodos', () => {
    const html = render({ status: 'ready', arbol, canEdit: true });

    expect(html).toContain('Agregar nodo');
    expect(html).toContain('Editar');
  });

  it('con el editor abierto muestra el formulario con sus errores en texto', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      tiposNodo: [{ value: 't-1', label: 'MENSAJE' }],
      editor: {
        mode: 'create',
        nodo: null,
        values: {
          idTipoNodo: '',
          texto: '',
          esNodoInicial: false,
          orden: '',
          idContenidoCronograma: '',
        },
        errors: { texto: 'Escribe el texto del nodo.' },
        saving: false,
        saveError: 'Ya existe un nodo inicial.',
      },
    });

    expect(html).toContain('Nuevo nodo');
    expect(html).toContain('MENSAJE');
    expect(html).toContain('Escribe el texto del nodo.');
    expect(html).toContain('Ya existe un nodo inicial.');
    expect(html).toContain('Crear nodo');
    expect(html).toContain('<dialog');
  });

  it('el formulario ofrece marcar el nodo como captura de perfil clínico (RF-25/RF-27B)', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      editor: {
        mode: 'create',
        nodo: null,
        values: {
          idTipoNodo: '',
          texto: '',
          esNodoInicial: false,
          orden: '',
          idContenidoCronograma: '',
          capturaPerfilDimension: 'TIPO_CRAVING',
        },
        errors: {},
        saving: false,
        saveError: '',
      },
    });

    expect(html).toContain('Captura de perfil clínico');
    expect(html).toContain('Tipo de dependencia');
    expect(html).toContain('Tipo de craving');
    expect(html).toContain('<option value="TIPO_CRAVING" selected="">');
  });

  it('el formulario ofrece elegir un contenido ya programado en un cronograma', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      contenidosCronograma: [
        {
          id_contenido_cronograma: 'cc-1',
          id_contenido: 'c-1',
          nombre_contenido: 'Video 1',
          id_unidad_temporal: 'ut-1',
          nombre_unidad: 'Semana 1',
          orden_unidad: 1,
        },
      ],
      editor: {
        mode: 'create',
        nodo: null,
        values: {
          idTipoNodo: '',
          texto: '',
          esNodoInicial: false,
          orden: '',
          idContenidoCronograma: '',
        },
        errors: {},
        saving: false,
        saveError: '',
      },
    });

    expect(html).toContain('Contenido asociado');
    expect(html).toContain('Video 1 · Semana 1');
  });

  it('un nodo con contenido asociado lo muestra en la lista de solo lectura', () => {
    const html = render({
      status: 'ready',
      arbol: {
        ...arbol,
        nodos: [
          { ...arbol.nodos[0], idContenidoCronograma: 'cc-1' },
          arbol.nodos[1],
        ],
      },
      contenidosCronograma: [
        {
          id_contenido_cronograma: 'cc-1',
          id_contenido: 'c-1',
          nombre_contenido: 'Video 1',
          id_unidad_temporal: 'ut-1',
          nombre_unidad: 'Semana 1',
          orden_unidad: 1,
        },
      ],
    });

    expect(html).toContain('Video 1 · Semana 1');
  });

  it('muestra el aviso de éxito tras guardar', () => {
    expect(
      render({ status: 'ready', arbol, notice: 'Nodo creado.' }),
    ).toContain('Nodo creado.');
  });
});

describe('GroupTreeDetailPage · cambio de estado del flujo', () => {
  it('un borrador ofrece publicar y archivar', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
    });

    expect(html).toContain('Publicar');
    expect(html).toContain('Archivar');
  });

  it('un publicado solo ofrece archivar, nunca despublicar', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, flujo: { ...arbol.flujo, estado: 'PUBLICADO' } },
      accionesEstado: ['ARCHIVAR'],
    });

    expect(html).toContain('Archivar');
    expect(html).not.toContain('Publicar');
  });

  it('un archivado no ofrece ninguna acción de estado', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, flujo: { ...arbol.flujo, estado: 'ARCHIVADO' } },
      accionesEstado: [],
    });

    expect(html).not.toContain('Publicar');
    expect(html).not.toContain('>Archivar<');
  });

  it('con una acción pendiente muestra el diálogo de confirmación', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
      confirmEstado: 'PUBLICAR',
    });

    expect(html).toContain('¿Publicar este flujo?');
  });

  it('muestra el error propio del cambio de estado', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
      errorEstado: 'El árbol no cumple las condiciones de integridad.',
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('El árbol no cumple las condiciones de integridad.');
  });
});

describe('GroupTreeDetailPage · árbol visual y transiciones (PR4)', () => {
  it('dibuja el árbol con cada nodo por su etiqueta', () => {
    const html = render({ status: 'ready', arbol });

    expect(html).toContain('Flujo del árbol');
    expect(html).toContain('1. Bienvenido a Brisa.');
    expect(html).toContain('2. (sin texto)');
  });

  it('un borrador ofrece agregar transición; otros estados no', () => {
    const editable = render({ status: 'ready', arbol, canEdit: true });
    expect(editable).toContain('Agregar transición');

    const soloLectura = render({ status: 'ready', arbol, canEdit: false });
    expect(soloLectura).not.toContain('Agregar transición');
  });

  const editorTransicion = (values = {}) => ({
    mode: 'create',
    transicion: null,
    values: { ...VALORES_TRANSICION_VACIOS, ...values },
    errors: {},
    saving: false,
    saveError: '',
  });
  const conOrigen = (entrada) => ({
    ...arbol,
    nodos: [arbol.nodos[0], { ...arbol.nodos[1], entrada }],
  });
  const renderTransicion = (entrada, values = {}) =>
    render({
      status: 'ready',
      arbol: conOrigen(entrada),
      canEdit: true,
      transitionEditor: editorTransicion({ idNodoOrigen: 'b', ...values }),
    });
  const opciones = [
    { valor: 'si', etiqueta: 'Opción afirmativa' },
    { valor: 'no', etiqueta: 'Opción negativa' },
  ];

  it('el editor de transición abre en un modal con Crear transición', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      transitionEditor: editorTransicion(),
    });

    expect(html).toContain('Nueva transición');
    expect(html).toContain('Crear transición');
    expect(html).toContain('<dialog');
    expect(html).toContain('Elige el nodo de origen para configurar la regla.');
  });

  it('un borrador ofrece editar cada transición de la lista; otros estados no', () => {
    const editable = render({ status: 'ready', arbol, canEdit: true });
    expect(editable).toMatch(/Editar transición/);

    const soloLectura = render({ status: 'ready', arbol, canEdit: false });
    expect(soloLectura).not.toMatch(/Editar transición/);
  });

  it('un nodo origen sin respuesta crea una transición automática, sin regla (RF-25)', () => {
    const html = renderTransicion(null);

    expect(html).toContain('Transición automática');
    expect(html).not.toContain('Mensaje de error');
  });

  it('selección única: tags fijos y valor esperado elegido de sus opciones (RF-25)', () => {
    const html = renderTransicion({ tipo: 'SELECCION_UNICA', opciones });

    expect(html).toContain('>Igualdad</strong>');
    expect(html).toContain('>Texto</strong>');
    expect(html).toContain('>Cualquier texto</strong>');
    expect(html).toMatch(/<select[^>]*id="transicion-valor-esperado"/);
    expect(html).toContain('>Opción afirmativa<');
    expect(html).not.toContain('id="transicion-operador"');
  });

  it('selección múltiple: casillas de sus opciones con los límites del nodo (RF-25)', () => {
    const html = renderTransicion({
      tipo: 'SELECCION_MULTIPLE',
      opciones,
      min_selecciones: 1,
      max_selecciones: 2,
    });

    expect(html).toContain('id="transicion-valor-si"');
    expect(html).toContain('id="transicion-valor-no"');
    expect(html).toContain('Marca entre 1 y 2 opciones');
    expect(html).toContain('>Texto</strong>');
  });

  it('Sí/No: tag Selección y valor esperado Sí o No (RF-25)', () => {
    const html = renderTransicion({ tipo: 'BOOLEANO' });

    expect(html).toContain('>Selección</strong>');
    expect(html).toContain('value="true">Sí</option>');
    expect(html).toContain('value="false">No</option>');
  });

  it('escala: rango fijo con mínimo y máximo acotados al nodo (RF-25)', () => {
    const html = renderTransicion({ tipo: 'ESCALA', min: 1, max: 10 });

    expect(html).toContain('>Rango</strong>');
    expect(html).toContain('>Numérico</strong>');
    expect(html).toContain('El nodo admite de 1 a 10.');
    expect(html).toContain('id="transicion-rango-min"');
  });

  it('número: el admin elige el operador; por igualdad lista los valores del nodo (RF-25)', () => {
    const sinOperador = renderTransicion({ tipo: 'NUMERICO', min: 0, max: 2 });
    expect(sinOperador).toContain('id="transicion-operador"');
    expect(sinOperador).not.toContain('>Igualdad</strong>');

    const igualdad = renderTransicion(
      { tipo: 'NUMERICO', min: 0, max: 2 },
      { operador: 'IGUALDAD' },
    );
    expect(igualdad).toMatch(/<select[^>]*id="transicion-valor-esperado"/);
    expect(igualdad).toContain('value="2">2</option>');
  });

  it('no ofrece Categoría en ningún caso (RF-25)', () => {
    const html = renderTransicion({ tipo: 'NUMERICO', min: 0, max: 2 });
    expect(html).not.toContain('Categoría');
  });

  it('no ofrece como origen nodos de texto libre o fecha (RF-25)', () => {
    const html = render({
      status: 'ready',
      arbol: conOrigen({ tipo: 'TEXTO_LIBRE' }),
      canEdit: true,
      transitionEditor: editorTransicion(),
    });
    const origen = html.match(
      /<select[^>]*id="transicion-origen"[\s\S]*?<\/select>/,
    )?.[0];
    expect(origen).toContain('1. Bienvenido a Brisa.');
    expect(origen).not.toContain('2. (sin texto)');
  });

  it('cancelar con cambios muestra la confirmación de descarte', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      transitionEditor: editorTransicion({ idNodoOrigen: 'a' }),
      confirmDescarte: 'transicion',
    });
    expect(html).toContain('¿Descartar los cambios?');
  });
});
