import { describe, expect, it } from 'vitest';

import { PROFILE_STATUS } from '../pages/ParticipantTrackingProfilePage/hooks/useParticipantTrackingProfile.js';
import { allowsDependentSections } from './profileSectionGate.js';

describe('Consulta de las secciones dependientes de la ficha', () => {
  it.each([
    [PROFILE_STATUS.READY],
    [PROFILE_STATUS.NO_PROFILE],
    [PROFILE_STATUS.UNAVAILABLE],
    [PROFILE_STATUS.ERROR],
    [PROFILE_STATUS.STALE_UNDATED],
  ])('%s: se consultan (cada una con su propia autorización; RF-149: la caída de M05 no bloquea a las demás)', (status) => {
    expect(allowsDependentSections({ status, isLoading: false })).toBe(true);
  });

  it.each([
    [PROFILE_STATUS.DENIED],
    [PROFILE_STATUS.NOT_FOUND],
    [PROFILE_STATUS.COHORT_NOT_FOUND],
    [PROFILE_STATUS.OUTSIDE_COHORT],
    [PROFILE_STATUS.INCONSISTENT],
    [null],
    ['DESCONOCIDO'],
  ])('%s: no se consulta nada más (acceso o identidad)', (status) => {
    expect(allowsDependentSections({ status, isLoading: false })).toBe(false);
  });

  it('mientras la ficha carga no se consulta nada', () => {
    expect(allowsDependentSections({ status: PROFILE_STATUS.READY, isLoading: true })).toBe(false);
  });
});
