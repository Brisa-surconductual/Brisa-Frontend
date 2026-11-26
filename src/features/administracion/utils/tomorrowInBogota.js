import {
  getCurrentDateInBogota,
  parseDateOnly,
} from '@/shared/utils/dateUtils.js';

const DAY_MS = 86_400_000;

// Suma días a una fecha de calendario `YYYY-MM-DD`, en UTC puro (sin zona).
export const addDays = (date, days) =>
  new Date(parseDateOnly(date) + days * DAY_MS).toISOString().slice(0, 10);

// Día siguiente al de hoy en America/Bogota, como `YYYY-MM-DD`. No depende
// de la zona del navegador.
export const getTomorrowInBogota = (now = new Date()) =>
  addDays(getCurrentDateInBogota(now), 1);
