import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ChatOfflinePage } from './ChatOfflinePage.jsx';
import { ERROR_FALLO_ESCRITURA } from './utils/offlineState.js';

/*
 * Integración básica de la pantalla: el hook se sustituye por estados
 * fijos (sin jsdom, ADR-0002); su lógica se prueba en utils/.
 */
const state = vi.hoisted(() => ({ value: null }));

vi.mock('./hooks/useChatOfflinePage.js', () => ({
  useChatOfflinePage: () => state.value,
}));

const NODO = Object.freeze({
  idNodo: 'n1',
  esTerminal: false,
  bloques: [{ tipo: 'TEXTO', texto: 'Pregunta ficticia' }],
  entrada: { tipo: 'NUMERICO', obligatorio: true, min: 0, max: 20, paso: 1 },
});

const BASE = Object.freeze({
  estado: 'LISTO',
  items: [{ tipo: 'nodo', id: 'nodo-0', nodo: NODO, actual: true }],
  hayHilo: true,
  nodoFormulario: NODO,
  claveFormulario: 'nodo-0',
  errorRespuesta: null,
  bloqueo: null,
  pendientes: 0,
  retomada: false,
  recursosNoPresentados: 0,
  otrosNoPresentables: 0,
  conectividad: 'EN_LINEA',
  restablecida: false,
  demo: false,
  simulada: false,
  alternarSimulacion: vi.fn(),
  sincronizacion: null,
  tituloRef: { current: null },
  ultimoRef: { current: null },
  bloqueoRef: { current: null },
  responder: vi.fn(),
  retry: vi.fn(),
  goChat: vi.fn(),
});

function render(cambios = {}) {
  state.value = { ...BASE, ...cambios };
  return renderToStaticMarkup(
    <MemoryRouter>
      <ChatOfflinePage />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '');
}

describe('pantalla del chat sin conexión', () => {
  it('muestra el nodo actual, su formulario y el estado de conexión', () => {
    const html = render();

    expect(html).toContain('Pregunta ficticia');
    expect(html).toContain('<form');
    expect(html).toContain('Con conexión.');
  });

  it('sin conexión y con pendientes lo dice sin prometer sincronización', () => {
    const html = render({ conectividad: 'SIN_CONEXION', pendientes: 2 });

    expect(html).toContain(
      'Sin conexión. Tus respuestas se guardan en este dispositivo.',
    );
    expect(html).toContain(
      '2 respuestas guardadas en el dispositivo, pendientes de sincronizar.',
    );
    expect(html).toContain('todavía no está disponible');
    expect(html).not.toContain('serán sincronizadas automáticamente');
  });

  it('fallo de escritura: mensaje de RF-34 junto al formulario', () => {
    expect(render({ errorRespuesta: ERROR_FALLO_ESCRITURA })).toContain(
      'No fue posible guardar la interacción en el dispositivo. Intente nuevamente.',
    );
  });

  it.each([
    [
      'SIN_PAQUETE',
      'el contenido de la sesión no está disponible en el dispositivo',
    ],
    ['NODO_AUSENTE', 'porque falta contenido necesario'],
    ['REGLA_NO_SOPORTADA', 'sus reglas de validación no se pueden aplicar'],
  ])('bloqueo %s: aviso y sin formulario', (bloqueo, texto) => {
    const html = render({ estado: 'BLOQUEADO', bloqueo, nodoFormulario: null });

    expect(html).toContain(texto);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('<form');
  });

  it('recurso sin caché: aviso de RF-34 y el texto sigue visible', () => {
    const html = render({ recursosNoPresentados: 1 });

    expect(html).toContain(
      'Parte del contenido multimedia no está disponible sin conexión.',
    );
    expect(html).toContain('Pregunta ficticia');
  });

  it('reapertura: aviso de retomar desde el último punto guardado', () => {
    expect(render({ retomada: true, pendientes: 1 })).toContain(
      'La sesión será retomada desde el último punto guardado.',
    );
  });

  it('sin motor de sincronización no promete sincronizar', () => {
    const html = render({ restablecida: true, pendientes: 1 });

    expect(html).toContain('La conexión se ha restablecido.');
    expect(html).not.toContain('serán sincronizadas automáticamente');
    expect(html).not.toContain('Sincronización simulada');
  });

  it('con la sincronización simulada: aviso de RF-34 y que no se envía nada', () => {
    const html = render({
      restablecida: true,
      pendientes: 2,
      sincronizacion: { sesion: { estado: 'PENDIENTE' }, simulada: true },
    });

    expect(html).toContain(
      'La conexión se ha restablecido. Las interacciones pendientes serán sincronizadas automáticamente.',
    );
    expect(html).not.toContain('todavía no está disponible');
    expect(html).toContain('no se envía información');
  });

  it('interrumpida y rechazada: mensajes del contrato y del servidor tal cual', () => {
    const interrumpida = render({
      pendientes: 2,
      sincronizacion: { sesion: { estado: 'INTERRUMPIDA' }, simulada: true },
    });
    expect(interrumpida).toContain(
      'La sincronización fue interrumpida. Los datos pendientes se sincronizarán cuando se restablezca la conexión.',
    );

    const rechazada = render({
      sincronizacion: {
        sesion: {
          estado: 'PENDIENTE_DE_RESOLUCION',
          error: {
            codigo: 'FUERA_DE_RANGO',
            mensaje: 'Mensaje ficticio del servidor.',
          },
          reconciliacion: { coincide: false },
        },
        simulada: true,
      },
    });
    expect(rechazada).toContain('queda pendiente de resolución');
    expect(rechazada).toContain('Mensaje ficticio del servidor.');
    expect(rechazada).toContain('Se conserva el avance del dispositivo.');
  });

  it('el control de simulación solo aparece en la demostración', () => {
    expect(render()).not.toContain('Simular falta de conexión');
    expect(render({ demo: true })).toContain('Simular falta de conexión');
  });
});
