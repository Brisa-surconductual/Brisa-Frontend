import { afterEach, describe, expect, it, vi } from 'vitest';

import { ParticipantTrackingProfilePage } from './ParticipantTrackingProfilePage.jsx';

/*
 * Cambio de participante en la URL: la ficha se monta de nuevo con una
 * clave por cohorte y referencia, de modo que ningún estado (ficha,
 * historial, M06, M07) del participante anterior sobrevive ni un render.
 */
const params = vi.hoisted(() => ({ value: {} }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => params.value,
}));

afterEach(() => {
  params.value = {};
});

describe('Cambio de participante sin datos residuales', () => {
  it('cada cohorte y referencia tiene su propia instancia de ficha', () => {
    params.value = { idCohorte: 'c-1', referencia: 'ref-1' };
    const first = ParticipantTrackingProfilePage();
    params.value = { idCohorte: 'c-1', referencia: 'ref-2' };
    const second = ParticipantTrackingProfilePage();
    params.value = { idCohorte: 'c-2', referencia: 'ref-1' };
    const third = ParticipantTrackingProfilePage();

    expect(first.key).toBe('c-1|ref-1');
    expect(new Set([first.key, second.key, third.key]).size).toBe(3);
    expect(first.type).toBe(second.type);
    expect(second.props).toEqual({ cohortId: 'c-1', reference: 'ref-2' });
  });
});
