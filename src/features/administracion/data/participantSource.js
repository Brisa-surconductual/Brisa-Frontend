import * as api from '../api/participantesCohorteApi.js';
import { getCohortSourceMode, loadDemoSource } from './cohortSource.js';
import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';

async function source() {
  return getCohortSourceMode() === COHORT_SOURCE_MODE.DEMO ? loadDemoSource() : api;
}

export async function listCohortParticipants(cohortId) {
  return (await source()).listCohortParticipants(cohortId);
}

export async function listAvailableParticipants(cohortId) {
  return (await source()).listAvailableParticipants(cohortId);
}

export async function assignParticipants(cohortId, participantIds) {
  return (await source()).assignParticipants(cohortId, participantIds);
}

export async function removeCohortParticipant(cohortId, participantId) {
  return (await source()).removeCohortParticipant(cohortId, participantId);
}
