import { describe, expect, it } from 'vitest';

import { PARTICIPATION_STATUS } from '../types/participantStatus.js';
import { DEMO_AVAILABILITY, DEMO_PARTICIPANT_CATALOG } from './participantCatalogDemoData.js';
import { DEMO_PARTICIPANTS } from './participantDemoData.js';

const ALLOWED_FIELDS = new Set([
  'id',
  'code',
  'registrationStatus',
  'consentStatus',
  'baselineStatus',
  'demoResult',
  'demoAvailability',
]);

describe('Catálogo ficticio de participantes disponibles', () => {
  it('solo tiene campos administrativos y de la demostración', () => {
    for (const candidate of DEMO_PARTICIPANT_CATALOG) {
      for (const field of Object.keys(candidate)) expect(ALLOWED_FIELDS.has(field)).toBe(true);
      expect(Object.keys(candidate.demoResult).sort()).toEqual(['participationStatus', 'pendingReasons']);
    }
    expect(JSON.stringify(DEMO_PARTICIPANT_CATALOG)).not.toMatch(/@|correo|nombre|documento|consumo/i);
  });

  it('usa códigos de ejemplo únicos que no se repiten con los ya asignados', () => {
    const codes = DEMO_PARTICIPANT_CATALOG.map(({ code }) => code);
    const assigned = new Set(DEMO_PARTICIPANTS.map(({ code }) => code));

    expect(codes).toEqual(['PART-0009', 'PART-0010', 'PART-0011', 'PART-0012', 'PART-0013', 'PART-0014']);
    for (const code of codes) expect(assigned.has(code)).toBe(false);
  });

  it('declara resultados explícitos: ACTIVO, pendiente con motivos, no disponible e inexistente', () => {
    const byCode = Object.fromEntries(DEMO_PARTICIPANT_CATALOG.map((candidate) => [candidate.code, candidate]));

    expect(byCode['PART-0009'].demoResult.participationStatus).toBe(PARTICIPATION_STATUS.ACTIVE);
    expect(byCode['PART-0010'].demoResult).toEqual({
      participationStatus: PARTICIPATION_STATUS.PENDING_VALIDATION,
      pendingReasons: ['Línea base no registrada.'],
    });
    expect(byCode['PART-0011'].demoResult.pendingReasons).toHaveLength(3);
    expect(byCode['PART-0013'].demoAvailability).toBe(DEMO_AVAILABILITY.UNAVAILABLE);
    expect(byCode['PART-0014'].demoAvailability).toBe(DEMO_AVAILABILITY.MISSING);
  });

  it('es inmutable', () => {
    expect(Object.isFrozen(DEMO_PARTICIPANT_CATALOG)).toBe(true);
    for (const candidate of DEMO_PARTICIPANT_CATALOG) {
      expect(Object.isFrozen(candidate)).toBe(true);
      expect(Object.isFrozen(candidate.demoResult.pendingReasons)).toBe(true);
    }
  });
});
