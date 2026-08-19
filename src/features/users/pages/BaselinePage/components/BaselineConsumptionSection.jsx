import { CalendarDays } from 'lucide-react';

import { SelectField } from '../../../../../shared/components/ui/SelectField/index.js';
import { TextField } from '../../../../../shared/components/ui/TextField/index.js';

import {
  CONSUMPTION_REASON_OPTIONS,
} from '../../../types/baselineCatalogs.js';

import { BaselineSection } from './BaselineSection.jsx';

export function BaselineConsumptionSection({
  form,
  errors,
  currentDate,
  onChange,
}) {
  return (
    <BaselineSection
      id="consumption-section"
      icon={
        <CalendarDays
          size={21}
          strokeWidth={1.6}
        />
      }
      title="Datos de consumo"
      description="Responde de acuerdo con tu experiencia personal."
    >
      <div className="rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[11px] leading-[1.55] text-[var(--info-text)]">
        Esta sección contiene información sensible.
        Tus respuestas serán tratadas de acuerdo con
        el consentimiento aceptado.
      </div>

      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
        <TextField
          id="consumptionStartDate"
          name="consumptionStartDate"
          type="date"
          label="Fecha aproximada de inicio"
          max={currentDate}
          value={form.consumptionStartDate}
          error={errors.consumptionStartDate}
          onChange={onChange}
          required
        />

        <TextField
          id="lastConsumptionDate"
          name="lastConsumptionDate"
          type="date"
          label="Fecha de último consumo"
          min={
            form.consumptionStartDate ||
            undefined
          }
          max={currentDate}
          value={form.lastConsumptionDate}
          error={errors.lastConsumptionDate}
          onChange={onChange}
          required
        />
      </div>

      <SelectField
        id="consumptionReason"
        name="consumptionReason"
        label="Motivo principal de inicio"
        options={CONSUMPTION_REASON_OPTIONS}
        value={form.consumptionReason}
        error={errors.consumptionReason}
        onChange={onChange}
        required
      />

      <TextField
        id="consumptionFrequency"
        name="consumptionFrequency"
        type="number"
        label="Frecuencia diaria aproximada"
        placeholder="Número de veces al día"
        hint="Puedes ingresar 0 si actualmente no consumes."
        inputMode="numeric"
        min="0"
        step="1"
        value={form.consumptionFrequency}
        error={errors.consumptionFrequency}
        onChange={onChange}
        required
      />
    </BaselineSection>
  );
}