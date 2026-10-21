import { describe, expect, it } from 'vitest';

import {
  createInitialRegistrationState,
  REGISTRATION_ACTION,
  registrationReducer,
} from './registrationReducer.js';
import {
  getModifiedFields,
  hasSensitiveChanges,
} from '../services/registrationReview.js';

const reducir = (state, type, payload) =>
  registrationReducer(state, { type, payload });
const lineaBase = {
  age: '2000-01-01',
  city: 'Neiva',
  consumptionFrequency: 'DIARIO',
};
const aceptacion = {
  status: 'VIGENTE',
  idConsentimeinto: 'consentimiento-vigente',
  consentVersion: '2026-10',
};

function revisionInicial() {
  let state = reducir(
    createInitialRegistrationState(),
    REGISTRATION_ACTION.SAVE_ACCOUNT,
    { email: 'registro@example.test' },
  );
  state = reducir(state, REGISTRATION_ACTION.SAVE_CONSENT, aceptacion);
  return reducir(state, REGISTRATION_ACTION.SAVE_BASELINE, lineaBase);
}

function editar(state, baseline) {
  const modifiedFields = getModifiedFields(state.baselineSnapshot, baseline);
  return reducir(state, REGISTRATION_ACTION.SAVE_EDITED_BASELINE, {
    baseline,
    modifiedFields,
    consentIsValid: !hasSensitiveChanges(modifiedFields),
  });
}

describe('edición desde revisión y reconsentimiento', () => {
  it('invalida el consentimiento al editar un dato sensible y conserva los datos de la cuenta', () => {
    const state = editar(revisionInicial(), {
      ...lineaBase,
      consumptionFrequency: 'SEMANAL',
    });
    expect(state.consent.status).toBe('NO_VIGENTE');
    expect(state.modifiedFields).toEqual(['consumptionFrequency']);
    expect(state.account.email).toBe('registro@example.test');
    expect(state.baselineSnapshot).toEqual(lineaBase);
  });

  it('conserva el consentimiento para modificaciones no sensibles', () => {
    expect(
      editar(revisionInicial(), { ...lineaBase, city: 'Pitalito' }).consent
        .status,
    ).toBe('VIGENTE');
  });

  it('la renovación cubre los datos editados y actualiza la referencia para la próxima edición', () => {
    const baseline = { ...lineaBase, consumptionFrequency: 'SEMANAL' };
    const state = reducir(
      editar(revisionInicial(), baseline),
      REGISTRATION_ACTION.RENEW_CONSENT,
      aceptacion,
    );
    expect(state.baseline).toEqual(baseline);
    expect(state.baselineSnapshot).toEqual(baseline);
    expect(state.modifiedFields).toEqual([]);
    expect(state.consent).toEqual(aceptacion);
    expect(editar(state, { ...baseline }).consent.status).toBe('VIGENTE');
    expect(editar(state, lineaBase).consent.status).toBe('NO_VIGENTE');
  });
});
