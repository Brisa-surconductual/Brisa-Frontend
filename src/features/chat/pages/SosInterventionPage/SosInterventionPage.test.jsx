import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ACCION_ERROR_ENVIO_SOS, FASE_SOS } from '../../types/sos.js';

import { ESTADO_RETORNO } from './hooks/useSosInterventionPage.js';
import { SosInterventionPage } from './SosInterventionPage.jsx';

let pageState;

vi.mock('./hooks/useSosInterventionPage.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useSosInterventionPage: () => pageState,
}));

const nodo = (cambios = {}) => ({
  idNodo: 'n1',
  tipoNodo: 'MENSAJE',
  esTerminal: false,
  disponibilidad: { habilitado: true, habilitaAprox: null },
  bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Respira conmigo.' }],
  entrada: null,
  ...cambios,
});

const recursos = [
  { nombre: 'Línea 106', telefono: '106' },
  { nombre: 'Bienestar USCO', telefono: 'POR_CONFIRMAR' },
];

const error = (codigo, status, mensaje = `Mensaje ${codigo}`) => ({
  status,
  codigo,
  mensaje,
  campo: null,
  reintentable: status === null || status >= 500,
});

function render(state) {
  pageState = {
    fase: FASE_SOS.ACTIVANDO,
    restanteMs: null,
    nodo: null,
    claveFormulario: 'k',
    enviando: false,
    cargandoNodo: false,
    errorNodo: null,
    errorEnvio: null,
    errorEnvioEnLinea: null,
    accionErrorEnvio: null,
    error: null,
    resultado: null,
    estadoDesconocido: false,
    recursos: [],
    retorno: { estado: ESTADO_RETORNO.INACTIVO },
    reanudaChat: false,
    tituloRef: { current: null },
    outcomeRef: { current: null },
    errorRef: { current: null },
    responder: () => {},
    reintentarEnvio: () => {},
    reintentarNodo: () => {},
    reintentarActivacion: () => {},
    cerrar: () => {},
    reintentarFinalizacion: () => {},
    volver: () => {},
    empezar: () => {},
    irAlInicio: () => {},
    ...state,
  };

  return renderToStaticMarkup(<SosInterventionPage />);
}

describe('SosInterventionPage (RF-43)', () => {
  it('abriendo: la interfaz aparece de inmediato, ocupada, sin temporizador ni acciones', () => {
    const html = render({});

    expect(html).toContain('Ejercicio de calma');
    expect(html).toContain('Abriendo tu ejercicio de calma');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('role="timer"');
    expect(html).not.toContain('<button');
  });

  it('en curso: nodo del backend, temporizador, Continuar y cierre anticipado', () => {
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 45_000,
      nodo: nodo(),
      recursos,
    });

    expect(html).toContain('Respira conmigo.');
    expect(html).toMatch(
      /role="timer" aria-label="Tiempo restante: 45 segundos"/,
    );
    expect(html).toContain('0:45');
    expect(html).toContain('Continuar');
    expect(html).toContain('Terminar el ejercicio');
    // Los recursos se muestran al terminar, no durante.
    expect(html).not.toContain('Línea 106');
  });

  it('en curso: no muestra perfil clínico', () => {
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 30_000,
      nodo: nodo(),
    });

    expect(html).not.toMatch(/tipo_craving|tipo_dependencia|craving/i);
  });

  it('enviando: el formulario queda bloqueado', () => {
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 30_000,
      nodo: nodo(),
      enviando: true,
    });

    expect(html).toMatch(/<button type="submit"[^>]*disabled/);
  });

  it('error en línea (400): se muestra junto al formulario con el mensaje del backend', () => {
    const e = error('VALOR_INVALIDO', 400, 'El valor no es válido.');
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 30_000,
      nodo: nodo(),
      errorEnvio: e,
      errorEnvioEnLinea: e,
      accionErrorEnvio: ACCION_ERROR_ENVIO_SOS.INLINE,
    });

    expect(html).toContain('El valor no es válido.');
    expect(html).toContain('Continuar');
  });

  it('sin conexión al responder: aviso con Reintentar', () => {
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 30_000,
      nodo: nodo(),
      errorEnvio: error('SIN_CONEXION', null, ''),
      accionErrorEnvio: ACCION_ERROR_ENVIO_SOS.REINTENTAR,
    });

    expect(html).toContain('No hay conexión');
    expect(html).toContain('Reintentar');
  });

  it('respuestas bloqueadas: sin formulario, queda terminar', () => {
    const html = render({
      fase: FASE_SOS.EN_CURSO,
      restanteMs: 30_000,
      nodo: nodo(),
      errorEnvio: error('NODO_DESACTUALIZADO', 409),
      accionErrorEnvio: ACCION_ERROR_ENVIO_SOS.BLOQUEADO,
    });

    expect(html).not.toContain('Continuar');
    expect(html).toContain('Mensaje NODO_DESACTUALIZADO');
    expect(html).toContain('Terminar el ejercicio');
  });

  it('nodo terminal: sin controles de respuesta', () => {
    const html = render({
      fase: FASE_SOS.FINALIZANDO,
      restanteMs: 20_000,
      nodo: nodo({
        esTerminal: true,
        bloques: [{ tipo: 'TEXTO', texto: 'Lo lograste.' }],
      }),
    });

    expect(html).toContain('Lo lograste.');
    expect(html).toContain('Cerrando el ejercicio');
    expect(html).not.toContain('Continuar');
    expect(html).not.toContain('Terminar el ejercicio');
  });

  it('finalizada: estado y duración del servidor, recursos con tel: y retorno', () => {
    const html = render({
      fase: FASE_SOS.FINALIZADA,
      restanteMs: 45_000,
      resultado: { estado: 'INCOMPLETA', duracionSegundos: 15 },
      recursos,
      reanudaChat: true,
    });

    expect(html).toContain('Ejercicio terminado antes del final');
    expect(html).toContain('Duración registrada: 15 segundos');
    expect(html).toContain('href="tel:106"');
    expect(html).toContain('aria-label="Llamar a Línea 106 al 106"');
    // Sin número marcable no hay enlace.
    expect(html).toContain('Bienestar USCO');
    expect(html).not.toContain('tel:POR_CONFIRMAR');
    expect(html).toContain('Volver a tu conversación');
  });

  it.each([
    ['COMPLETA', 'Ejercicio completado'],
    ['EXPIRADA', 'Se agotó el tiempo del ejercicio'],
  ])('finalizada %s', (estado, texto) => {
    const html = render({
      fase: FASE_SOS.FINALIZADA,
      resultado: { estado, duracionSegundos: 60 },
    });

    expect(html).toContain(texto);
    expect(html).toContain('Duración registrada: 1 minuto');
    expect(html).toContain('Volver a lo que estabas haciendo');
  });

  it('cerrada por el backend: no inventa estado ni duración', () => {
    const html = render({
      fase: FASE_SOS.FINALIZADA,
      estadoDesconocido: true,
      error: error(
        'INTERVENCION_FINALIZADA',
        409,
        'Este ejercicio de calma ya terminó.',
      ),
      recursos,
    });

    expect(html).toContain('No pudimos confirmar cómo terminó el ejercicio.');
    expect(html).toContain('Este ejercicio de calma ya terminó.');
    expect(html).not.toContain('Duración registrada');
    expect(html).toContain('Línea 106');
  });

  it('error al cerrar: mensaje, reintento, recursos y retorno', () => {
    const html = render({
      fase: FASE_SOS.ERROR_FINALIZACION,
      nodo: nodo(),
      error: error('SIN_CONEXION', null, ''),
      recursos,
    });

    expect(html).toContain('No hay conexión');
    expect(html).toContain('Intentar cerrar de nuevo');
    expect(html).toContain('Línea 106');
    expect(html).toContain('Volver a lo que estabas haciendo');
  });

  it.each([
    ['SIN_FLUJO_SOS', 404],
    ['CSRF_INVALIDO', 403],
  ])(
    'error de activación %s: mensaje del backend y retorno, sin reintento',
    (codigo, status) => {
      const html = render({
        fase: FASE_SOS.ERROR_ACTIVACION,
        error: error(codigo, status),
      });

      expect(html).toContain(`Mensaje ${codigo}`);
      expect(html).not.toContain('Reintentar');
      expect(html).toContain('Volver a lo que estabas haciendo');
    },
  );

  it('409 INTERVENCION_EN_CURSO: explica que no se puede continuar aquí', () => {
    const html = render({
      fase: FASE_SOS.ERROR_ACTIVACION,
      error: error(
        'INTERVENCION_EN_CURSO',
        409,
        'Ya estás en un ejercicio de calma. Continuemos.',
      ),
    });

    expect(html).toContain('Ya estás en un ejercicio de calma.');
    expect(html).toContain('no se puede continuar aquí');
  });

  it('sin conexión al activar: Reintentar', () => {
    const html = render({
      fase: FASE_SOS.ERROR_ACTIVACION,
      error: error('SIN_CONEXION', null, ''),
    });

    expect(html).toContain('Reintentar');
  });

  it('sin intervención en la pestaña: un toque la empieza', () => {
    const html = render({ fase: FASE_SOS.SIN_INTERVENCION });

    expect(html).toContain(
      'No hay un ejercicio de calma abierto en esta pestaña.',
    );
    expect(html).toContain('Empezar el ejercicio de calma');
  });

  it('retomando la conversación: botón ocupado', () => {
    const html = render({
      fase: FASE_SOS.FINALIZADA,
      resultado: { estado: 'COMPLETA', duracionSegundos: 40 },
      reanudaChat: true,
      retorno: { estado: ESTADO_RETORNO.REANUDANDO },
    });

    expect(html).toContain('Retomando tu conversación');
    expect(html).toContain('aria-busy="true"');
  });

  it.each([
    [true, 'no en el mismo punto'],
    [false, 'No pudimos retomar la misma conversación'],
  ])(
    'reanudación no exacta (misma sesión: %s) se avisa',
    (mismaSesion, texto) => {
      const html = render({
        fase: FASE_SOS.FINALIZADA,
        resultado: { estado: 'COMPLETA', duracionSegundos: 40 },
        retorno: {
          estado: ESTADO_RETORNO.NO_EXACTO,
          mismaSesion,
          destino: '/x',
        },
      });

      expect(html).toContain(texto);
      expect(html).toContain('Ir a la conversación');
    },
  );
});
