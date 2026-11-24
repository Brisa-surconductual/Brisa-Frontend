import { describe, expect, it, vi } from 'vitest';

import {
  TIPO_RETORNO_SOS,
  decidirRetornoSos,
  reanudarSesionPausada,
} from './retornoSos.js';

const PAUSADA = 'c0000000-0000-4000-8000-000000000003';
const OTRA = 'd0000000-0000-4000-8000-000000000004';

const chat = {
  modulo: 'CHAT',
  ruta: `/app/estudiante/chat/sesion/${PAUSADA}`,
  estado: null,
};
const diario = {
  modulo: 'DIARIO',
  ruta: '/app/estudiante/diario/nuevo',
  estado: null,
};

describe('decidirRetornoSos', () => {
  it('desde el chat con sesión pausada: se reanuda (sesión y nodo esperados)', () => {
    expect(
      decidirRetornoSos({
        resultado: {
          sesionPausada: { idSesion: PAUSADA, idNodoActual: 'n7' },
          contextoRetorno: chat,
        },
      }),
    ).toEqual({
      tipo: TIPO_RETORNO_SOS.REANUDAR_CHAT,
      idSesion: PAUSADA,
      idNodo: 'n7',
    });
  });

  it('desde otro módulo: vuelve a su ruta (la sesión sigue en pausa)', () => {
    expect(
      decidirRetornoSos({
        resultado: {
          sesionPausada: { idSesion: PAUSADA, idNodoActual: 'n7' },
          contextoRetorno: diario,
        },
      }),
    ).toEqual({
      tipo: TIPO_RETORNO_SOS.RUTA,
      ruta: '/app/estudiante/diario/nuevo',
    });
  });

  it('sin sesión previa no se inventa una: vuelve a la ruta del chat', () => {
    expect(
      decidirRetornoSos({
        resultado: {
          sesionPausada: null,
          contextoRetorno: { ...chat, ruta: '/app/estudiante/chat' },
        },
      }),
    ).toEqual({ tipo: TIPO_RETORNO_SOS.RUTA, ruta: '/app/estudiante/chat' });
  });

  it('sin resultado de cierre: usa lo conocido de la activación (nodo desconocido)', () => {
    expect(
      decidirRetornoSos({
        intervencion: { sesionPausada: { idSesion: PAUSADA } },
        contexto: chat,
      }),
    ).toEqual({
      tipo: TIPO_RETORNO_SOS.REANUDAR_CHAT,
      idSesion: PAUSADA,
      idNodo: null,
    });
  });

  it('una ruta de retorno insegura se ignora y se vuelve al inicio', () => {
    expect(
      decidirRetornoSos({
        resultado: {
          contextoRetorno: { modulo: 'OTRO', ruta: 'https://x.example' },
        },
      }),
    ).toEqual({ tipo: TIPO_RETORNO_SOS.RUTA, ruta: '/app/estudiante' });
  });
});

describe('reanudarSesionPausada (RF-32)', () => {
  const modelo = (idSesion, idNodo) => ({
    sesion: { idSesion },
    conversacion: { nodo: { idNodo } },
  });

  it('misma sesión y mismo nodo: reanudación exacta con un solo /iniciar', async () => {
    const iniciar = vi.fn().mockResolvedValue('data');
    const mapear = vi.fn(() => modelo(PAUSADA, 'n7'));

    await expect(
      reanudarSesionPausada(
        { idSesion: PAUSADA, idNodo: 'n7' },
        { iniciar, mapear },
      ),
    ).resolves.toMatchObject({
      exacta: true,
      destino: `/app/estudiante/chat/sesion/${PAUSADA}`,
    });
    expect(iniciar).toHaveBeenCalledTimes(1);
    expect(mapear).toHaveBeenCalledWith('data');
  });

  it('otro nodo u otra sesión: no es exacta', async () => {
    const otroNodo = await reanudarSesionPausada(
      { idSesion: PAUSADA, idNodo: 'n7' },
      { iniciar: async () => ({}), mapear: () => modelo(PAUSADA, 'n8') },
    );
    const otraSesion = await reanudarSesionPausada(
      { idSesion: PAUSADA, idNodo: null },
      { iniciar: async () => ({}), mapear: () => modelo(OTRA, 'n1') },
    );

    expect(otroNodo).toMatchObject({
      exacta: false,
      mismaSesion: true,
      mismoNodo: false,
    });
    expect(otraSesion).toMatchObject({ exacta: false, mismaSesion: false });
  });

  it('el error de /iniciar sube tal cual', async () => {
    const error = { status: 401 };

    await expect(
      reanudarSesionPausada(
        { idSesion: PAUSADA, idNodo: null },
        { iniciar: () => Promise.reject(error) },
      ),
    ).rejects.toBe(error);
  });
});
