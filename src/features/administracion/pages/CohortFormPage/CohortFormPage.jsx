import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  FlaskConical,
  PlugZap,
  RefreshCw,
  SearchX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortForm } from '../../components/CohortForm/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';
import { CohortStatusBadge } from '../../components/CohortStatusBadge/index.js';

import {
  COHORT_FORM_MODE,
  COHORT_LIST_PATH,
  useCohortFormPage,
} from './hooks/useCohortFormPage.js';

const COPY = Object.freeze({
  [COHORT_FORM_MODE.CREATE]: Object.freeze({
    title: 'Nueva cohorte',
    description: 'Registra el nombre, el periodo del programa y el cronograma psicoeducativo de la cohorte.',
    submitText: 'Crear cohorte',
    loadingText: 'Creando cohorte...',
    statusHint: 'La cohorte se creará en estado Borrador; no se activará automáticamente.',
  }),
  [COHORT_FORM_MODE.EDIT]: Object.freeze({
    title: 'Editar cohorte',
    description: 'Actualiza el nombre, el periodo del programa o el cronograma asociado.',
    submitText: 'Guardar cambios',
    loadingText: 'Aplicando cambios...',
    statusHint: 'El estado de la cohorte no cambia desde este formulario.',
  }),
});

/*
 * Crear (/cohortes/nueva) o editar (/cohortes/:idCohorte/editar)
 * una cohorte (RF-124). La página solo compone: el estado y las
 * reglas viven en useCohortFormPage.
 */
export function CohortFormPage({ mode = COHORT_FORM_MODE.CREATE }) {
  const { idCohorte } = useParams();
  const {
    form,
    errors,
    scheduleOptions,
    hasActiveSchedules,
    replacedSchedule,
    currentStatus,
    isLoading,
    loadError,
    notFound,
    isSubmitting,
    submitError,
    isDemo,
    isIntegrationPending,
    handleChange,
    handleSubmit,
    handleCancel,
    retry,
  } = useCohortFormPage({ mode, cohortId: idCohorte ?? null });

  const copy = COPY[mode] ?? COPY[COHORT_FORM_MODE.CREATE];
  const showForm = !isIntegrationPending && !isLoading && !loadError && !notFound;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={COHORT_LIST_PATH}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Volver a cohortes
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Cohortes
        </p>

        <div className="flex flex-wrap items-center gap-[var(--space-3)]">
          <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
            {copy.title}
          </h1>

          {showForm && currentStatus && <CohortStatusBadge status={currentStatus} />}
        </div>

        <p className="m-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          {copy.description}
        </p>
      </header>

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Modo de demostración" role="note">
          Los cambios son temporales y no se guardan en el servidor.
        </CohortNotice>
      )}

      {isIntegrationPending && (
        <CohortNotice tone="info" icon={PlugZap} title="Integración pendiente" role="status">
          La gestión de cohortes todavía no está conectada al servidor. No es
          posible crear ni editar cohortes desde esta pantalla.
        </CohortNotice>
      )}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando formulario...
          </p>
          <div
            className="h-[420px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
      )}

      {!isLoading && loadError && (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title="Formulario no disponible"
          role="alert"
          action={
            <Button variant="secondary" onClick={retry}>
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          {loadError}
        </CohortNotice>
      )}

      {!isLoading && notFound && (
        <CohortNotice tone="neutral" icon={SearchX} title="Cohorte no encontrada" role="alert">
          No existe una cohorte con este identificador. Vuelve al listado para
          elegir otra.
        </CohortNotice>
      )}

      {submitError && showForm && (
        <CohortNotice tone="danger" icon={AlertTriangle} title="No se aplicaron los cambios" role="alert">
          {submitError}
        </CohortNotice>
      )}

      {showForm && (
        <CohortForm
          form={form}
          errors={errors}
          scheduleOptions={scheduleOptions}
          hasActiveSchedules={hasActiveSchedules}
          replacedSchedule={replacedSchedule}
          isSubmitting={isSubmitting}
          submitText={copy.submitText}
          loadingText={copy.loadingText}
          statusHint={copy.statusHint}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
