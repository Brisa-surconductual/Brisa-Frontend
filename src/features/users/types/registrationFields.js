export const BASELINE_FIELD_LABELS = {
  age: 'Edad',
  educationalInstitution: 'Entidad educativa',
  academicProgram: 'Programa académico',
  semester: 'Semestre cursado',
  academicLevel: 'Nivel académico',
  city: 'Ciudad',
  consumptionStartDate: 'Fecha de inicio de consumo',
  consumptionReason: 'Motivo de inicio',
  lastConsumptionDate: 'Fecha de último consumo',
  consumptionFrequency: 'Frecuencia de consumo',
};

export const SENSITIVE_BASELINE_FIELDS = new Set([
  'age',
  'consumptionStartDate',
  'consumptionReason',
  'lastConsumptionDate',
  'consumptionFrequency',
]);

export const ACADEMIC_FIELDS = [
  'age',
  'educationalInstitution',
  'academicProgram',
  'semester',
  'academicLevel',
  'city',
];

export const CONSUMPTION_FIELDS = [
  'consumptionStartDate',
  'consumptionReason',
  'lastConsumptionDate',
  'consumptionFrequency',
];