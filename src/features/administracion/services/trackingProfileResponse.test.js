import { describe, expect, it } from 'vitest';

import { PROFILE_OUTCOME } from '../types/participantTracking.js';

import { interpretProfileResponse } from './trackingProfileResponse.js';

const CODE = 'P-7F3A91C2';

const body = (changes = {}) => ({
  codigo_participante: CODE,
  indicadores_adherencia: { tasa_adherencia: 0.41, dias_con_registro: 10 },
  indicadores_progreso: { nivel_progreso: 'EN_AVANCE', unidades_completadas: 4 },
  tendencia_consumo: 'REDUCCION',
  alertas_activas: [
    {
      id_alerta: 'a0000000-0000-4000-8000-000000000001',
      tipo_alerta: 'INACTIVIDAD',
      fecha_generacion: '2026-11-20T14:00:00Z',
      estado_resolucion: 'ACTIVA',
    },
    {
      id_alerta: 'a0000000-0000-4000-8000-000000000002',
      tipo_alerta: 'CRAVING_ELEVADO',
      fecha_generacion: '2026-11-12T22:15:00Z',
      estado_resolucion: 'ATENDIDA',
    },
  ],
  fecha_actualizacion: '2026-11-22T05:00:00Z',
  modo_consulta: 'SOLO_LECTURA',
  ...changes,
});

describe('interpretProfileResponse (RF-128, contrato real)', () => {
  it('200 válido: interpreta el DTO directamente', () => {
    expect(interpretProfileResponse(body(), { code: CODE })).toEqual({
      outcome: PROFILE_OUTCOME.OK,
      code: CODE,
      profile: {
        progressLevel: 'EN_AVANCE',
        completedUnits: 4,
        adherence: 0.41,
        daysWithRecord: 10,
        trend: 'REDUCCION',
        activeAlerts: [
          { id: 'a0000000-0000-4000-8000-000000000001', type: 'INACTIVIDAD', generatedAt: '2026-11-20T14:00:00Z', status: 'ACTIVA' },
          { id: 'a0000000-0000-4000-8000-000000000002', type: 'CRAVING_ELEVADO', generatedAt: '2026-11-12T22:15:00Z', status: 'ATENDIDA' },
        ],
        updatedAt: '2026-11-22T05:00:00Z',
      },
    });
  });

  it('no exige un campo de autorización: la autorización es el 200 tras las guardas', () => {
    expect(interpretProfileResponse(body(), { code: CODE }).outcome).toBe(PROFILE_OUTCOME.OK);
    expect(interpretProfileResponse(body({ access: 'DENEGADO' }), { code: CODE }).outcome).toBe(PROFILE_OUTCOME.OK);
  });

  it('acepta el código pedido en minúsculas o con espacios', () => {
    expect(interpretProfileResponse(body(), { code: ' p-7f3a91c2 ' }).code).toBe(CODE);
  });

  it('descarta campos ajenos (UUID internos, correo, textos clínicos)', () => {
    const result = interpretProfileResponse(
      body({ id_usuario: 'u-1', correo: 'a@b.co', texto_diario: 'Texto', nivel_craving: 9 }),
      { code: CODE },
    );

    expect(JSON.stringify(result)).not.toMatch(/u-1|@|Texto|craving_|nivel_craving/);
  });

  it('204: sin perfil, conserva solo el código pedido', () => {
    expect(interpretProfileResponse(null, { code: CODE })).toEqual({ outcome: PROFILE_OUTCOME.NO_PROFILE, code: CODE, profile: null });
  });

  it('aislamiento: un perfil de otro participante se bloquea entero', () => {
    expect(interpretProfileResponse(body({ codigo_participante: 'P-00000001' }), { code: CODE })).toEqual({
      outcome: PROFILE_OUTCOME.INCONSISTENT,
    });
  });

  it('indicadores ausentes: no disponibles, nunca 0', () => {
    const { profile } = interpretProfileResponse(
      body({
        indicadores_adherencia: { tasa_adherencia: null, dias_con_registro: null },
        indicadores_progreso: { nivel_progreso: null, unidades_completadas: null },
      }),
      { code: CODE },
    );

    expect(profile).toMatchObject({ progressLevel: null, completedUnits: null, adherence: null, daysWithRecord: null });
  });

  it.each([
    ['no es objeto', 'texto'],
    ['sin código', body({ codigo_participante: undefined })],
    ['sin modo de solo lectura', body({ modo_consulta: undefined })],
    ['otro modo de consulta', body({ modo_consulta: 'EDICION' })],
    ['sin indicadores de adherencia', body({ indicadores_adherencia: null })],
    ['sin indicadores de progreso', body({ indicadores_progreso: 'EN_AVANCE' })],
    ['adherencia como porcentaje', body({ indicadores_adherencia: { tasa_adherencia: 41, dias_con_registro: 10 } })],
    ['días negativos', body({ indicadores_adherencia: { tasa_adherencia: 0.4, dias_con_registro: -1 } })],
    ['nivel como porcentaje', body({ indicadores_progreso: { nivel_progreso: 62.5, unidades_completadas: 4 } })],
    ['alertas que no son lista', body({ alertas_activas: null })],
    ['alerta que no es objeto', body({ alertas_activas: ['INACTIVIDAD'] })],
  ])('respuesta inválida (%s): ningún dato', (_, data) => {
    expect(interpretProfileResponse(data, { code: CODE })).toEqual({ outcome: PROFILE_OUTCOME.INVALID });
  });

  it('sin código pedido no se interpreta nada', () => {
    expect(interpretProfileResponse(body(), { code: null })).toEqual({ outcome: PROFILE_OUTCOME.INVALID });
  });
});
