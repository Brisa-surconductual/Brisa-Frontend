import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ESTADO_PANTALLA_ENTRADA } from '../../types/estadoPantallaEntrada.js';

import { ChatEntryPage } from './ChatEntryPage.jsx';

let pageState;

vi.mock('./hooks/useChatEntryPage.js', () => ({
  useChatEntryPage: () => pageState,
}));

const sesion = {
  reanudada: true,
  sesion: { fechaUltimaInteraccion: '2026-11-05T15:00:00.000Z' },
  ubicacionTemporal: { nombreUnidad: 'Semana 1', finalizadoPrograma: false },
};

function render(state) {
  pageState = {
    estado: ESTADO_PANTALLA_ENTRADA.CARGANDO,
    sesion: null,
    error: null,
    retry: () => {},
    goHome: () => {},
    goLogin: () => {},
    goConversation: () => {},
    ...state,
  };

  return renderToStaticMarkup(<ChatEntryPage />);
}

describe('ChatEntryPage (RF-24)', () => {
  it('cargando: aviso accesible ocupado y sin botones', () => {
    const html = render({});

    expect(html).toContain('Preparando tu sesión');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('<button');
  });

  it('reanudando: muestra la unidad y la última actividad', () => {
    const html = render({
      estado: ESTADO_PANTALLA_ENTRADA.REANUDANDO,
      sesion,
    });

    expect(html).toContain('Retomamos donde quedaste');
    expect(html).toContain('Semana 1');
    expect(html).toContain('Última actividad');
  });

  it('lista: sesión nueva desde el inicio', () => {
    const html = render({
      estado: ESTADO_PANTALLA_ENTRADA.LISTA,
      sesion: { ...sesion, reanudada: false },
    });

    expect(html).toContain('Tu sesión está lista');
  });

  it('lista muestra «Comenzar» y reanudando «Continuar» (D2)', () => {
    const lista = render({
      estado: ESTADO_PANTALLA_ENTRADA.LISTA,
      sesion: { ...sesion, reanudada: false },
    });
    const reanudando = render({
      estado: ESTADO_PANTALLA_ENTRADA.REANUDANDO,
      sesion,
    });

    expect(lista).toContain('Comenzar');
    expect(lista).not.toContain('Continuar');
    expect(reanudando).toContain('Continuar');
    expect(reanudando).not.toContain('Comenzar');
  });

  it('error reintentable: mensaje del backend tal cual, con Reintentar', () => {
    const html = render({
      estado: ESTADO_PANTALLA_ENTRADA.ERROR,
      error: {
        mensaje: 'Error al recuperar el estado de la conversación.',
        reintentable: true,
        requiereLogin: false,
      },
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('Error al recuperar el estado de la conversación.');
    expect(html).toContain('Reintentar');
    expect(html).toContain('Volver al inicio');
    expect(html).not.toContain('Iniciar sesión');
  });

  it('error no reintentable: sin Reintentar', () => {
    const html = render({
      estado: ESTADO_PANTALLA_ENTRADA.ERROR,
      error: {
        mensaje: 'No disponible.',
        reintentable: false,
        requiereLogin: false,
      },
    });

    expect(html).not.toContain('Reintentar');
    expect(html).toContain('Volver al inicio');
  });

  it('error 401: ofrece iniciar sesión', () => {
    const html = render({
      estado: ESTADO_PANTALLA_ENTRADA.ERROR,
      error: {
        mensaje: 'Debe iniciar sesión.',
        reintentable: false,
        requiereLogin: true,
      },
    });

    expect(html).toContain('Iniciar sesión');
  });
});
