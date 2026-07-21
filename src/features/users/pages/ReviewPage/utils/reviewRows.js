import {
  formatAcademicLevel,
  formatConsumptionFrequency,
  formatConsumptionReason,
  formatDate,
} from '../../../utils/registrationFormatters.js';

function markModifiedRows(
  rows,
  modifiedFields = [],
) {
  const modifiedFieldsSet = new Set(
    modifiedFields,
  );

  return rows.map((row) => ({
    ...row,
    modified: row.field
      ? modifiedFieldsSet.has(row.field)
      : false,
  }));
}

export function createAccountRows(account) {
  return [
    {
      label: 'Correo electrónico',
      value: account.email,
    },
  ];
}

export function createAcademicRows(
  baseline,
  modifiedFields,
) {
  const rows = [
    {
      field: 'age',
      label: 'Edad',
      value: `${baseline.age} años`,
    },
    {
      field: 'city',
      label: 'Ciudad',
      value: baseline.city,
    },
    {
      field: 'educationalInstitution',
      label: 'Entidad educativa',
      value: baseline.educationalInstitution,
    },
    {
      field: 'academicProgram',
      label: 'Programa académico',
      value: baseline.academicProgram,
    },
    {
      field: 'semester',
      label: 'Semestre cursado',
      value: baseline.semester,
    },
    {
      field: 'academicLevel',
      label: 'Nivel académico',
      value: formatAcademicLevel(
        baseline.academicLevel,
      ),
    },
  ];

  return markModifiedRows(
    rows,
    modifiedFields,
  );
}

export function createConsumptionRows(
  baseline,
  modifiedFields,
) {
  const rows = [
    {
      field: 'consumptionStartDate',
      label: 'Inicio de consumo',
      value: formatDate(
        baseline.consumptionStartDate,
      ),
    },
    {
      field: 'lastConsumptionDate',
      label: 'Último consumo',
      value: formatDate(
        baseline.lastConsumptionDate,
      ),
    },
    {
      field: 'consumptionReason',
      label: 'Motivo principal',
      value: formatConsumptionReason(
        baseline.consumptionReason,
      ),
    },
    {
      field: 'consumptionFrequency',
      label: 'Frecuencia aproximada',
      value: formatConsumptionFrequency(
        baseline.consumptionFrequency,
      ),
    },
  ];

  return markModifiedRows(
    rows,
    modifiedFields,
  );
}