import { CalendarRange, Layers, ListTree, TriangleAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Formulario de cohorte (RF-124): nombre, periodo del programa y
 * cronograma activo asociado. Presentacional: recibe valores, errores
 * y manejadores; no sabe de dónde vienen los datos ni cómo se guardan.
 */
function SectionTitle({ icon: Icon, id, children }) {
  return (
    <div className="flex items-center gap-[var(--space-2)]">
      <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
      <h3 id={id} className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
        {children}
      </h3>
    </div>
  );
}

export function CohortForm({
  form,
  errors = {},
  scheduleOptions = [],
  hasActiveSchedules = true,
  replacedSchedule = null,
  isSubmitting = false,
  submitText,
  loadingText,
  statusHint,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
      aria-labelledby="cohort-form-title"
      noValidate
    >
      <fieldset
        disabled={isSubmitting}
        className="m-0 flex min-w-0 flex-col gap-[var(--space-6)] border-0 p-0"
      >
        <div className="flex items-start gap-[var(--space-3)]">
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
            aria-hidden="true"
          >
            <Layers size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h2
              id="cohort-form-title"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Información de la cohorte
            </h2>
            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Los campos con * son obligatorios.
              {statusHint && <> {statusHint}</>}
            </p>
          </div>
        </div>

        <TextField
          id="cohort-name"
          name="name"
          label="Nombre de la cohorte"
          placeholder="Ej. Cohorte 2026-1"
          autoComplete="off"
          value={form.name}
          error={errors.name}
          onChange={onChange}
          required
        />

        <section aria-labelledby="cohort-period-title" className="flex flex-col gap-[var(--space-3)]">
          <SectionTitle icon={CalendarRange} id="cohort-period-title">
            Periodo del programa
          </SectionTitle>

          <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
            <TextField
              id="cohort-start-date"
              name="startDate"
              type="date"
              label="Fecha de inicio"
              value={form.startDate}
              error={errors.startDate}
              onChange={onChange}
              required
            />

            <TextField
              id="cohort-end-date"
              name="endDate"
              type="date"
              label="Fecha de finalización"
              hint="Puede coincidir con la fecha de inicio, pero no ser anterior."
              value={form.endDate}
              error={errors.endDate}
              onChange={onChange}
              required
            />
          </div>
        </section>

        <section aria-labelledby="cohort-schedule-title" className="flex flex-col gap-[var(--space-3)]">
          <SectionTitle icon={ListTree} id="cohort-schedule-title">
            Cronograma psicoeducativo
          </SectionTitle>

          {replacedSchedule && (
            <CohortNotice tone="warning" icon={TriangleAlert} title="Cronograma actual no activo" role="status">
              El cronograma asociado, «{replacedSchedule}», ya no está activo.
              Selecciona un cronograma activo para guardar los cambios.
            </CohortNotice>
          )}

          {hasActiveSchedules ? (
            <SelectField
              id="cohort-schedule"
              name="scheduleId"
              label="Cronograma asociado"
              placeholder="Selecciona un cronograma activo"
              hint="Solo se muestran cronogramas activos."
              options={scheduleOptions}
              value={form.scheduleId}
              error={errors.scheduleId}
              onChange={onChange}
              required
            />
          ) : (
            <CohortNotice tone="warning" icon={TriangleAlert} title="No hay cronogramas activos" role="alert">
              Una cohorte debe asociarse a un cronograma psicoeducativo activo.
              Activa un cronograma antes de continuar.
            </CohortNotice>
          )}
        </section>

        <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={!hasActiveSchedules}
            loading={isSubmitting}
            loadingText={loadingText}
          >
            {submitText}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
