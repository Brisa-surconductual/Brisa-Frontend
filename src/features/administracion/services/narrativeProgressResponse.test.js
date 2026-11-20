import { describe, expect, it } from 'vitest';

import { SECTION_OUTCOME } from '../types/participantEngagement.js';
import { TRACKING_ACCESS } from '../types/participantTracking.js';
import { interpretNarrativeProgressResponse } from './narrativeProgressResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const response = (narrative, changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  narrative,
  ...changes,
});

const FULL = Object.freeze({
  activePhaseName: 'Fase 2',
  lastCompletedChapterName: 'Capítulo 2.3',
  achievements: [{ name: 'Logro A', unlockedAt: '2026-03-01T18:20:00-05:00', achievementId: 'uuid-logro', rule: 'regla' }],
  narrativeProfileId: '8f1c2d3e-0000-4000-8000-000000000001',
  activePhaseId: 'uuid-fase',
  lastCompletedChapterId: 'uuid-capitulo',
  gamificationLevel: 4,
  progressState: 'ACTIVA',
});

const interpret = (value) => interpretNarrativeProgressResponse(value, REQUEST);

describe('Progresión narrativa (RF-130)', () => {
  it('autorizada: solo fase, capítulo y logros (nombre y fecha)', () => {
    const result = interpret(response(FULL, { email: 'x@example.com', participantId: 'interno' }));

    expect(result).toEqual({
      outcome: SECTION_OUTCOME.OK,
      data: {
        activePhaseName: 'Fase 2',
        lastCompletedChapterName: 'Capítulo 2.3',
        achievements: [{ name: 'Logro A', unlockedAt: '2026-03-01T18:20:00-05:00' }],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/uuid|8f1c2d3e|gamification|ACTIVA|regla|@|interno|ref-1/);
  });

  it.each([
    ['DENEGADO', response(FULL, { access: TRACKING_ACCESS.DENIED })],
    ['sin acceso declarado', response(FULL, { access: undefined })],
  ])('%s: denegada, sin ningún dato aunque la respuesta lo traiga', (_, value) => {
    expect(interpret(value)).toEqual({ outcome: SECTION_OUTCOME.DENIED });
  });

  it.each([
    ['otro participante', response(FULL, { reference: 'ref-2' })],
    ['otra cohorte', response(FULL, { cohortId: 'c-2' })],
  ])('%s: bloqueada (409)', (_, value) => {
    expect(interpret(value)).toEqual({ outcome: SECTION_OUTCOME.INCONSISTENT });
  });

  it('sin progresión (204) y con forma inválida', () => {
    expect(interpret(response(null))).toEqual({ outcome: SECTION_OUTCOME.EMPTY });
    expect(interpret(response(undefined))).toEqual({ outcome: SECTION_OUTCOME.EMPTY });
    expect(interpret(response('Fase 2'))).toEqual({ outcome: SECTION_OUTCOME.MALFORMED });
    expect(interpret(response([]))).toEqual({ outcome: SECTION_OUTCOME.MALFORMED });
  });

  it('fase o capítulo ausentes quedan en null: no se inventan', () => {
    const { data } = interpret(response({ activePhaseName: ' ', achievements: [] }));

    expect(data).toEqual({ activePhaseName: null, lastCompletedChapterName: null, achievements: [] });
  });

  it('distingue logros vacíos ([]) de no disponibles (null)', () => {
    expect(interpret(response({ ...FULL, achievements: [] })).data.achievements).toEqual([]);
    expect(interpret(response({ ...FULL, achievements: undefined })).data.achievements).toBeNull();
    expect(interpret(response({ ...FULL, achievements: 'logros' })).data.achievements).toBeNull();
  });

  it('un logro sin nombre o que no es objeto se conserva sin nombre, sin inventarlo', () => {
    const { achievements } = interpret(response({ ...FULL, achievements: [{ unlockedAt: 'x' }, 'texto'] })).data;

    expect(achievements).toEqual([{ name: null, unlockedAt: 'x' }, { name: null, unlockedAt: null }]);
  });

  it('el resultado es inmutable', () => {
    const result = interpret(response(FULL));

    expect(Object.isFrozen(result.data)).toBe(true);
    expect(Object.isFrozen(result.data.achievements)).toBe(true);
    expect(Object.isFrozen(result.data.achievements[0])).toBe(true);
  });
});
