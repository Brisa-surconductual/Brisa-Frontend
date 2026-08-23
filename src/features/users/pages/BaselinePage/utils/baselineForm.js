export const INITIAL_BASELINE = Object.freeze({
  age: '',
  educationalInstitution: '',
  academicProgram: '',
  semester: '',
  academicLevel: '',
  city: '',
  consumptionStartDate: '',
  consumptionReason: '',
  lastConsumptionDate: '',
  consumptionFrequency: '',
});

function toDateOnly(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

export function createBaselineFormState(baseline) {
  if (!baseline) {
    return {
      ...INITIAL_BASELINE,
    };
  }

  const normalizedBaseline = {
    age:
      baseline.age ??
      toDateOnly(baseline.fechaNacimiento),

    educationalInstitution:
      baseline.educationalInstitution ??
      baseline.entidad_educativa ??
      '',

    academicProgram:
      baseline.academicProgram ??
      baseline.programa_academico ??
      '',

    semester:
      baseline.semester ??
      baseline.semestre ??
      '',

    academicLevel:
      baseline.academicLevel ??
      baseline.nivelAcademico ??
      '',

    city:
      baseline.city ??
      baseline.ciudad ??
      '',

    consumptionStartDate:
      baseline.consumptionStartDate ??
      toDateOnly(baseline.fechaInicioConsumo),

    consumptionReason:
      baseline.consumptionReason ??
      baseline.motivoInicioConsumo ??
      '',

    lastConsumptionDate:
      baseline.lastConsumptionDate ??
      toDateOnly(baseline.fechaUltimoConsumo),

    consumptionFrequency:
      baseline.consumptionFrequency ??
      baseline.frecuenciaConsumo ??
      '',
  };

  return {
    ...INITIAL_BASELINE,
    ...normalizedBaseline,
  };
}

function toIsoMidnight(dateOnlyString) {
  return `${toDateOnly(dateOnlyString)}T00:00:00.000Z`;
}

export function normalizeBaselineForm(form) {
  return {
    fechaNacimiento: toIsoMidnight(form.age),
    entidad_educativa: form.educationalInstitution.trim(),
    programa_academico: form.academicProgram.trim(),
    semestre: Number(form.semester),
    nivelAcademico: form.academicLevel,
    ciudad: form.city.trim(),
    fechaInicioConsumo: toIsoMidnight(form.consumptionStartDate),
    motivoInicioConsumo: form.consumptionReason,
    fechaUltimoConsumo: toIsoMidnight(form.lastConsumptionDate),
    frecuenciaConsumo: Number(form.consumptionFrequency),
  };
}