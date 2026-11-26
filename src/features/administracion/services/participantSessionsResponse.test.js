import { describe, expect, it } from 'vitest';

import { TRACE_QUERY_STATUS as S } from '../types/chatTraceability.js';

import { appendSessionsPage, interpretParticipantSessions } from './participantSessionsResponse.js';

const CODE = 'P-1A2B3C4D';
const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;

const item = (n, changes = {}) => ({
  id_sesion: id(n),
  modalidad: 'GRUPAL',
  estado: 'COMPLETADA',
  fecha_inicio: '2026-11-20T14:00:00.000Z',
  fecha_ultima_interaccion: '2026-11-20T14:20:00.000Z',
  ...changes,
});

const data = (changes = {}) => ({
  id_participante: CODE,
  items: [item(1)],
  total: 1,
  siguiente_cursor: null,
  ...changes,
});

describe('interpretParticipantSessions (RF-38)', () => {
  it('proyecta solo los campos del contrato', () => {
    const result = interpretParticipantSessions(
      data({ items: [item(1, { correo: 'x@example.com', id_usuario: 'interno' })] }),
      { code: CODE },
    );

    expect(result).toEqual({
      ok: true,
      page: {
        code: CODE,
        sessions: [
          {
            id: id(1),
            modality: 'GRUPAL',
            state: 'COMPLETADA',
            startedAt: '2026-11-20T14:00:00.000Z',
            lastInteractionAt: '2026-11-20T14:20:00.000Z',
          },
        ],
        total: 1,
        nextCursor: null,
      },
    });
    expect(JSON.stringify(result)).not.toContain('example.com');
  });

  it('participante sin sesiones', () => {
    expect(interpretParticipantSessions(data({ items: [], total: 0 }), { code: CODE }).page.sessions).toEqual([]);
  });

  it('varias modalidades, incluida SOS, y todos los estados', () => {
    const items = [
      item(1, { modalidad: 'GRUPAL', estado: 'ACTIVA' }),
      item(2, { modalidad: 'PERSONALIZADA', estado: 'PAUSADA' }),
      item(3, { modalidad: 'SOS', estado: 'COMPLETADA' }),
      item(4, { modalidad: 'GRUPAL', estado: 'ERROR_CONFIGURACION' }),
    ];
    const { page } = interpretParticipantSessions(data({ items, total: 4 }), { code: CODE });

    expect(page.sessions.map(({ modality, state }) => `${modality}/${state}`)).toEqual([
      'GRUPAL/ACTIVA', 'PERSONALIZADA/PAUSADA', 'SOS/COMPLETADA', 'GRUPAL/ERROR_CONFIGURACION',
    ]);
  });

  it('total distinto de los elementos cargados y cursor opaco sin tocar', () => {
    const cursor = 'eyJmIjoiMjAyNi0xMS0yMFQxNDoyMDowMC4xMjM0NTZaIiwicyI6IngifQ';
    const { page } = interpretParticipantSessions(data({ total: 45, siguiente_cursor: cursor }), { code: CODE });

    expect(page.total).toBe(45);
    expect(page.nextCursor).toBe(cursor);
  });

  it('respuesta de otro participante: MISMATCH, sin datos', () => {
    expect(interpretParticipantSessions(data({ id_participante: 'P-FFFFFFFF' }), { code: CODE })).toEqual({
      ok: false,
      status: S.MISMATCH,
    });
  });

  it.each([
    ['sin objeto', null],
    ['items no es lista', data({ items: 'x' })],
    ['total no entero', data({ total: '1' })],
    ['total menor que los items', data({ total: 0 })],
    ['cursor vacío', data({ siguiente_cursor: '' })],
    ['id no UUID', data({ items: [item(1, { id_sesion: 'x' })] })],
    ['sin modalidad', data({ items: [item(1, { modalidad: '' })] })],
    ['fecha no textual', data({ items: [item(1, { fecha_inicio: 1 })] })],
    ['sesión repetida', data({ items: [item(1), item(1)], total: 2 })],
  ])('%s: INVALID_RESPONSE', (_, value) => {
    expect(interpretParticipantSessions(value, { code: CODE })).toEqual({ ok: false, status: S.INVALID_RESPONSE });
  });
});

describe('appendSessionsPage', () => {
  const first = interpretParticipantSessions(data({ total: 2, siguiente_cursor: 'c1' }), { code: CODE }).page;
  const second = interpretParticipantSessions(data({ items: [item(2)], total: 2 }), { code: CODE }).page;

  it('agrega la página siguiente y toma el cursor nuevo (última página: null)', () => {
    const { page } = appendSessionsPage(first, second);

    expect(page.sessions.map((s) => s.id)).toEqual([id(1), id(2)]);
    expect(page.nextCursor).toBeNull();
  });

  it('una sesión ya cargada invalida la página nueva', () => {
    expect(appendSessionsPage(first, first)).toEqual({ ok: false, status: S.INVALID_RESPONSE });
  });

  it('nunca mezcla participantes', () => {
    expect(appendSessionsPage(first, { ...second, code: 'P-FFFFFFFF' })).toEqual({ ok: false, status: S.MISMATCH });
  });
});
