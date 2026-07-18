export const ACADEMIC_LEVEL_OPTIONS = [
  {
    value: 'PREGRADO',
    label: 'Pregrado',
  },
  {
    value: 'POSGRADO',
    label: 'Posgrado',
  },
];

export const CONSUMPTION_REASON_OPTIONS = [
  {
    value: 'ESTRES',
    label: 'Estrés',
  },
  {
    value: 'PRESION_SOCIAL',
    label: 'Presión social',
  },
  {
    value: 'CURIOSIDAD',
    label: 'Curiosidad',
  },
  {
    value: 'ANSIEDAD',
    label: 'Ansiedad',
  },
  {
    value: 'HABITO',
    label: 'Hábito',
  },
  {
    value: 'OTRO',
    label: 'Otro',
  },
];

export const ACADEMIC_LEVEL_VALUES = new Set(
  ACADEMIC_LEVEL_OPTIONS.map((option) => option.value),
);

export const CONSUMPTION_REASON_VALUES = new Set(
  CONSUMPTION_REASON_OPTIONS.map((option) => option.value),
);