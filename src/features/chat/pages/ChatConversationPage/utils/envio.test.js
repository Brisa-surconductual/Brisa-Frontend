import { describe, expect, it } from 'vitest';

import {
  ACCION_ERROR_ENVIO as A,
  clasificarErrorEnvio,
  crearCuerpo,
  nuevoIdRespuesta,
} from './envio.js';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const escala = { idNodo: 'n1', entrada: { tipo: 'ESCALA' } };

describe('crearCuerpo (D6, D7)', () => {
  it('ESCALA 7 viaja como número con id y hora con desfase (CA-27-4)', () => {
    const cuerpo = crearCuerpo(escala, 7);

    expect(cuerpo).toMatchObject({
      idNodo: 'n1',
      tipoEntrada: 'ESCALA',
      valor: 7,
    });
    expect(cuerpo.idRespuesta).toMatch(UUID);
    expect(cuerpo.capturadaEn).toMatch(/[+-]\d{2}:\d{2}$/);
    expect(Object.keys(cuerpo)).not.toContain('id_usuario');
  });

  it('cada confirmación genera un idRespuesta nuevo', () => {
    expect(crearCuerpo(escala, 7).idRespuesta).not.toBe(
      crearCuerpo(escala, 7).idRespuesta,
    );
  });

  it.each([
    ['entrada null', { idNodo: 'n2', entrada: null }],
    ['tipo CONTINUAR', { idNodo: 'n2', entrada: { tipo: 'CONTINUAR' } }],
  ])('%s envía CONTINUAR con valor null (CA-27-6)', (_caso, nodo) => {
    expect(crearCuerpo(nodo, 'x')).toMatchObject({
      tipoEntrada: 'CONTINUAR',
      valor: null,
    });
  });
});

it('sin randomUUID (contexto sin HTTPS) arma un UUID v4 (D19)', () => {
  const sinRandomUUID = {
    getRandomValues: (b) => globalThis.crypto.getRandomValues(b),
  };
  const id = nuevoIdRespuesta(sinRandomUUID);

  expect(id).toMatch(UUID);
  expect(id).not.toBe(nuevoIdRespuesta(sinRandomUUID));
});

describe('clasificarErrorEnvio (tabla 2.5)', () => {
  it.each([
    [{ status: 400, codigo: 'RESPUESTA_OBLIGATORIA' }, A.INLINE],
    [{ status: 400, codigo: 'VALOR_NO_PERMITIDO' }, A.INLINE],
    [{ status: 400, codigo: 'CODIGO_NUEVO' }, A.INLINE],
    [{ status: 400, codigo: 'TIPO_ENTRADA_NO_PERMITIDO' }, A.VOLVER_AL_INICIO],
    [{ status: 401, codigo: 'DESCONOCIDO' }, A.LOGIN],
    [{ status: 403, codigo: 'DESCONOCIDO' }, A.VOLVER_AL_CHAT],
    [{ status: 404, codigo: 'SESION_NO_ENCONTRADA' }, A.VOLVER_AL_CHAT],
    [{ status: 409, codigo: 'NODO_DESACTUALIZADO' }, A.DESACTUALIZADO],
    [{ status: 409, codigo: 'NODO_TERMINAL' }, A.VOLVER_AL_INICIO],
    [{ status: 409, codigo: 'SESION_NO_ACTIVA' }, A.VOLVER_AL_INICIO],
    [{ status: 409, codigo: 'CAPTURA_FUERA_DE_GRUPAL' }, A.VOLVER_AL_INICIO],
    [
      { status: 500, codigo: 'SIN_TRANSICION', reintentable: true },
      A.REINTENTAR,
    ],
    [
      { status: null, codigo: 'SIN_CONEXION', reintentable: true },
      A.REINTENTAR,
    ],
  ])('%j → %s', (error, accion) => {
    expect(clasificarErrorEnvio(error)).toBe(accion);
  });
});
