import { describe, expect, it } from 'vitest';

import { SECTION_OUTCOME, SECTION_STATUS } from '../types/participantEngagement.js';
import { TRACKING_ACCESS } from '../types/participantTracking.js';
import {
  checkSectionEnvelope,
  sectionStatusFromError,
  sectionStatusFromOutcome,
  textOrNull,
} from './profileSectionResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });
const envelope = (changes = {}) => ({ access: TRACKING_ACCESS.GRANTED, cohortId: 'c-1', reference: 'ref-1', ...changes });

describe('Autorización explícita y aislamiento de cada sección', () => {
  it('autorizada y de la cohorte y referencia pedidas: no bloquea', () => {
    expect(checkSectionEnvelope(envelope(), REQUEST)).toBeNull();
  });

  it.each([
    ['DENEGADO', envelope({ access: TRACKING_ACCESS.DENIED })],
    ['sin campo de acceso', envelope({ access: undefined })],
    ['un booleano no basta', envelope({ access: true })],
    ['respuesta vacía', null],
  ])('%s: denegada', (_, response) => {
    expect(checkSectionEnvelope(response, REQUEST)).toBe(SECTION_OUTCOME.DENIED);
  });

  it.each([
    ['otra referencia', envelope({ reference: 'ref-2' })],
    ['otra cohorte', envelope({ cohortId: 'c-2' })],
    ['sin referencia', envelope({ reference: undefined })],
  ])('%s: inconsistente', (_, response) => {
    expect(checkSectionEnvelope(response, REQUEST)).toBe(SECTION_OUTCOME.INCONSISTENT);
  });
});

describe('Estado de la sección por resultado o código, nunca por texto', () => {
  it.each([
    [SECTION_OUTCOME.OK, SECTION_STATUS.READY],
    [SECTION_OUTCOME.EMPTY, SECTION_STATUS.EMPTY],
    [SECTION_OUTCOME.DENIED, SECTION_STATUS.DENIED],
    [SECTION_OUTCOME.INCONSISTENT, SECTION_STATUS.INCONSISTENT],
    [SECTION_OUTCOME.MALFORMED, SECTION_STATUS.ERROR],
    ['OTRO', SECTION_STATUS.ERROR],
  ])('resultado %s', (outcome, status) => {
    expect(sectionStatusFromOutcome(outcome)).toBe(status);
  });

  it.each([
    ['ACCESO_DENEGADO', SECTION_STATUS.DENIED],
    ['PERMISO_EXPLICITO_REQUERIDO', SECTION_STATUS.PERMISSION_REQUIRED],
    ['PARTICIPANTE_NO_ENCONTRADO', SECTION_STATUS.NOT_FOUND],
    ['COHORTE_NO_ENCONTRADA', SECTION_STATUS.COHORT_NOT_FOUND],
    ['PARTICIPANTE_FUERA_DE_COHORTE', SECTION_STATUS.OUTSIDE_COHORT],
    ['MODULO_NO_DISPONIBLE', SECTION_STATUS.UNAVAILABLE],
    [undefined, SECTION_STATUS.ERROR],
  ])('código %s', (code, status) => {
    expect(sectionStatusFromError(Object.assign(new Error('x'), { code }))).toBe(status);
  });

  it('un mensaje «no disponible» o «sin permisos» sin código es un error genérico', () => {
    expect(sectionStatusFromError(new Error('El módulo de gamificación no se encuentra disponible'))).toBe(SECTION_STATUS.ERROR);
    expect(sectionStatusFromError(new Error('No tiene permisos'))).toBe(SECTION_STATUS.ERROR);
    expect(sectionStatusFromError(null)).toBe(SECTION_STATUS.ERROR);
  });

  it('textos: recorta y convierte vacíos y no textos en null', () => {
    expect(textOrNull('  Fase  ')).toBe('Fase');
    expect(textOrNull(' ')).toBeNull();
    expect(textOrNull(3)).toBeNull();
  });
});
