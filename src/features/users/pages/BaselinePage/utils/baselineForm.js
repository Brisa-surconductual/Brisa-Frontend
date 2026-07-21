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

export function createBaselineFormState(baseline) {
  return {
    ...INITIAL_BASELINE,
    ...(baseline ?? {}),
  };
}

export function normalizeBaselineForm(form) {
  return {
    age: form.age,
    educationalInstitution:
      form.educationalInstitution.trim(),
    academicProgram: form.academicProgram.trim(),
    semester: form.semester,
    academicLevel: form.academicLevel,
    city: form.city.trim(),
    consumptionStartDate:
      form.consumptionStartDate,
    consumptionReason: form.consumptionReason,
    lastConsumptionDate:
      form.lastConsumptionDate,
    consumptionFrequency:
      form.consumptionFrequency,
  };
}