import {
  BookOpen,
  GraduationCap,
  MapPin,
} from 'lucide-react';

import { SelectField } from '../../../../../shared/components/ui/SelectField/index.js';
import { TextField } from '../../../../../shared/components/ui/TextField/index.js';

import {
  ACADEMIC_LEVEL_OPTIONS,
} from '../../../types/baselineCatalogs.js';

import { BaselineSection } from './BaselineSection.jsx';

import styles from './BaselineFields.module.css';

export function BaselineAcademicSection({
  form,
  errors,
  onChange,
}) {
  return (
    <BaselineSection
      id="academic-section"
      icon={
        <GraduationCap
          size={21}
          strokeWidth={1.6}
        />
      }
      title="Datos académicos"
      description="Información general de tu contexto educativo."
    >
      <div className={styles.grid}>
        <TextField
          id="age"
          name="age"
          type="number"
          label="Edad"
          placeholder="Ej. 20"
          inputMode="numeric"
          min="1"
          step="1"
          value={form.age}
          error={errors.age}
          onChange={onChange}
          required
        />

        <TextField
          id="city"
          name="city"
          label="Ciudad"
          placeholder="Ej. Neiva"
          value={form.city}
          error={errors.city}
          onChange={onChange}
          startIcon={
            <MapPin
              size={19}
              strokeWidth={1.5}
            />
          }
          required
        />
      </div>

      <TextField
        id="educationalInstitution"
        name="educationalInstitution"
        label="Entidad educativa"
        placeholder="Nombre de tu institución"
        value={form.educationalInstitution}
        error={errors.educationalInstitution}
        onChange={onChange}
        startIcon={
          <BookOpen
            size={19}
            strokeWidth={1.5}
          />
        }
        required
      />

      <TextField
        id="academicProgram"
        name="academicProgram"
        label="Programa académico"
        placeholder="Ej. Ingeniería de Software"
        value={form.academicProgram}
        error={errors.academicProgram}
        onChange={onChange}
        required
      />

      <div className={styles.grid}>
        <TextField
          id="semester"
          name="semester"
          type="number"
          label="Semestre cursado"
          placeholder="Ej. 8"
          inputMode="numeric"
          min="1"
          step="1"
          value={form.semester}
          error={errors.semester}
          onChange={onChange}
          required
        />

        <SelectField
          id="academicLevel"
          name="academicLevel"
          label="Nivel académico"
          options={ACADEMIC_LEVEL_OPTIONS}
          value={form.academicLevel}
          error={errors.academicLevel}
          onChange={onChange}
          required
        />
      </div>
    </BaselineSection>
  );
}