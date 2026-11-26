import { describe, expect, it } from 'vitest';

import { mapResultadoRespuesta } from './resultadoRespuesta.js';

describe('mapResultadoRespuesta (RF-29, RF-30)', () => {
  it('toma la secuencia confirmada y el estado de la sesión', () => {
    expect(
      mapResultadoRespuesta({
        id_interaccion: 'i',
        secuencia: 4,
        duplicada: false,
        transicion: { es_terminal: false },
        estado_sesion: 'ACTIVA',
      }),
    ).toEqual({ secuencia: 4, estadoSesion: 'ACTIVA' });
  });

  it('sin datos devuelve nulos', () => {
    expect(mapResultadoRespuesta(undefined)).toEqual({
      secuencia: null,
      estadoSesion: null,
    });
  });
});
