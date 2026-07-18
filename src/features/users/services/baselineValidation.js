import {
  ACADEMIC_LEVEL_VALUES,
  CONSUMPTION_REASON_VALUES,
} from '../types/baselineCatalogs.js';

import {
  getCurrentDateInBogota,
  parseDateOnly,
} from '../../../shared/utils/dateUtils.js';

function isPositiveInteger(value) {
  if (value === '') {
    return false;
  }

  const number = Number(value);

  return Number.isInteger(number) && number > 0;
}

function isNonNegativeInteger(value) {
  if (value === '') {
    return false;
  }

  const number = Number(value);

  return Number.isInteger(number) && number >= 0;
}

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

export function validateBaselineForm(form) {
  const errors = {};

  if (!isPositiveInteger(form.age)) {
    errors.age =
      'Ingresa una edad válida usando un número entero.';
  }

  if (isBlank(form.educationalInstitution)) {
    errors.educationalInstitution =
      'La entidad educativa es obligatoria.';
  }

  if (isBlank(form.academicProgram)) {
    errors.academicProgram =
      'El programa académico es obligatorio.';
  }

  if (!isPositiveInteger(form.semester)) {
    errors.semester =
      'Ingresa el semestre usando un número entero mayor que cero.';
  }

  if (!ACADEMIC_LEVEL_VALUES.has(form.academicLevel)) {
    errors.academicLevel =
      'Selecciona un nivel académico válido.';
  }

  if (isBlank(form.city)) {
    errors.city = 'La ciudad es obligatoria.';
  }

  if (
    !CONSUMPTION_REASON_VALUES.has(
      form.consumptionReason,
    )
  ) {
    errors.consumptionReason =
      'Selecciona un motivo de inicio válido.';
  }

  if (
    !isNonNegativeInteger(
      form.consumptionFrequency,
    )
  ) {
    errors.consumptionFrequency =
      'Ingresa una frecuencia entera mayor o igual a cero.';
  }

  const currentDate = getCurrentDateInBogota();

  const currentDateTimestamp =
    parseDateOnly(currentDate);

  const startDateTimestamp =
    parseDateOnly(form.consumptionStartDate);

  const lastConsumptionTimestamp =
    parseDateOnly(form.lastConsumptionDate);

  if (!form.consumptionStartDate) {
    errors.consumptionStartDate =
      'La fecha de inicio de consumo es obligatoria.';
  } else if (startDateTimestamp === null) {
    errors.consumptionStartDate =
      'La fecha de inicio de consumo no es válida.';
  } else if (
    startDateTimestamp > currentDateTimestamp
  ) {
    errors.consumptionStartDate =
      'La fecha de inicio de consumo no puede estar en el futuro.';
  }

  if (!form.lastConsumptionDate) {
    errors.lastConsumptionDate =
      'La fecha de último consumo es obligatoria.';
  } else if (lastConsumptionTimestamp === null) {
    errors.lastConsumptionDate =
      'La fecha de último consumo no es válida.';
  } else if (
    lastConsumptionTimestamp > currentDateTimestamp
  ) {
    errors.lastConsumptionDate =
      'La fecha de último consumo no puede estar en el futuro.';
  }

  const datesAreValid =
    startDateTimestamp !== null &&
    lastConsumptionTimestamp !== null;

  const datesAreNotFuture =
    datesAreValid &&
    startDateTimestamp <= currentDateTimestamp &&
    lastConsumptionTimestamp <=
      currentDateTimestamp;

  if (
    datesAreNotFuture &&
    lastConsumptionTimestamp <
      startDateTimestamp
  ) {
    errors.lastConsumptionDate =
      'La fecha de último consumo no puede ser anterior a la fecha de inicio.';
  }

  return errors;
}