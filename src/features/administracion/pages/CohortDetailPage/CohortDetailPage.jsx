import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  FlaskConical,
  ListTree,
  PlugZap,
  RefreshCw,
  SearchX,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortNotice } from '../../components/CohortNotice/index.js';
import { CohortPeriod } from '../../components/CohortPeriod/index.js';
import { CohortStatusBadge } from '../../components/CohortStatusBadge/index.js';
import { ParticipantAssignmentPanel } from '../../components/ParticipantAssignmentPanel/index.js';
import { ParticipantAssignmentResult } from '../../components/ParticipantAssignmentResult/index.js';
import { ParticipantCard } from '../../components/ParticipantCard/index.js';
import { PARTICIPATION_STATUS } from '../../types/participantStatus.js';

import { COHORT_LIST_PATH, useCohortDetail } from './hooks/useCohortDetail.js';
import { useParticipantAssignment } from './hooks/useParticipantAssignment.js';

const PARTICIPATION_SUMMARY = Object.freeze([
  Object.freeze({ status: PARTICIPATION_STATUS.ACTIVE, singular: 'activo', plural: 'activos' }),
  Object.freeze({
    status: PARTICIPATION_STATUS.PENDING_VALIDATION,
    singular: 'pendiente de validación',
    plural: 'pendientes de validación',
  }),
  Object.freeze({ status: PARTICIPATION_STATUS.INACTIVE, singular: 'inactivo', plural: 'inactivos' }),
]);

function participantCount(total) {
  return `${total} ${total === 1 ? 'participante' : 'participantes'}`;
}

function SummaryItem({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
      <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
        <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
        {label}
      </dt>
      <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-secondary)] tabular-nums">
        {children}
      </dd>
    </div>
  );
}

/*
 * Detalle de una cohorte con la consulta y la asignación de sus
 * participantes (/cohortes/:idCohorte, RF-125). El retiro aún no existe.
 * La página solo compone; el estado vive en useCohortDetail y
 * useParticipantAssignment.
 */
export function CohortDetailPage() {
  const { idCohorte } = useParams();
  const {
    cohort,
    participants,
    participationCounts,
    isLoading,
    loadError,
    notFound,
    participantsError,
    isDemo,
    isIntegrationPending,
    canManage,
    retry,
    addParticipants,
  } = useCohortDetail({ cohortId: idCohorte ?? null });

  const title = cohort?.name?.trim() || (cohort ? 'Sin nombre' : 'Detalle de cohorte');
  const showCohort = Boolean(cohort) && !isLoading;

  const {
    canAssign,
    isOpen: isAssigning,
    available,
    unavailable,
    isLoadingCandidates,
    catalogError,
    selected,
    selectionError,
    conflicts,
    requestError,
    isSubmitting,
    result: assignmentResult,
    headingRef,
    resultRef,
    triggerRef,
    open: openAssignment,
    cancel: cancelAssignment,
    toggle,
    remove,
    submit,
    retryCatalog,
    dismissResult,
  } = useParticipantAssignment({
    cohortId: idCohorte ?? null,
    // Sin la lista actual no se ofrece asignar: evitaría ver duplicados.
    enabled: Boolean(canManage) && showCohort && !participantsError,
    onAssigned: addParticipants,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
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
          <h1 className="m-0 min-w-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
            {title}
          </h1>

          {showCohort && <CohortStatusBadge status={cohort.status} />}
        </div>

        <p className="m-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Consulta los participantes asociados a la cohorte y su estado
          administrativo de registro, consentimiento y línea base.
        </p>
      </header>

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Estás viendo participantes ficticios del modo de desarrollo: los
          códigos son ejemplos y no corresponden a estudiantes reales. Los
          cambios de cohortes son temporales y no se guardan en el servidor.
        </CohortNotice>
      )}

      {isIntegrationPending && (
        <CohortNotice tone="info" icon={PlugZap} title="Integración pendiente" role="status">
          La consulta de participantes todavía no está conectada al servidor.
          Cuando se integre, aquí aparecerán los participantes de la cohorte.
        </CohortNotice>
      )}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando cohorte y participantes...
          </p>

          <div
            className="h-[112px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            aria-hidden="true"
          />

          <ul
            className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((index) => (
              <li
                key={index}
                className="h-[200px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              />
            ))}
          </ul>
        </div>
      )}

      {!isLoading && loadError && (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title="Cohorte no disponible"
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
          La cohorte seleccionada no existe. Vuelve al listado para elegir otra.
        </CohortNotice>
      )}

      {showCohort && (
        <>
          <section aria-labelledby="resumen-cohorte">
            <h2 id="resumen-cohorte" className="sr-only">
              Resumen de la cohorte
            </h2>

            <dl className="m-0 grid grid-cols-1 gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] text-[length:var(--font-size-sm)] shadow-[var(--shadow-sm)] md:grid-cols-3">
              <SummaryItem icon={CalendarRange} label="Periodo del programa">
                <CohortPeriod startDate={cohort.startDate} endDate={cohort.endDate} />
              </SummaryItem>

              <SummaryItem icon={ListTree} label="Cronograma asociado">
                {cohort.scheduleName?.trim() ||
                  (cohort.scheduleId ? 'Nombre no disponible' : 'Sin cronograma asociado')}
              </SummaryItem>

              <SummaryItem icon={UsersRound} label="Participantes">
                {participantsError ? 'No disponible' : participantCount(participants.length)}
              </SummaryItem>
            </dl>
          </section>

          <section aria-labelledby="participantes-cohorte" className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col gap-[var(--space-2)]">
              <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
                <h2
                  id="participantes-cohorte"
                  className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
                >
                  Participantes
                </h2>

                {!participantsError && participants.length > 0 && (
                  <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                    {participantCount(participants.length)}
                    {PARTICIPATION_SUMMARY.filter(({ status }) => participationCounts[status] > 0).map(
                      ({ status, singular, plural }) => (
                        <span key={status}>
                          {' · '}
                          {participationCounts[status]}{' '}
                          {participationCounts[status] === 1 ? singular : plural}
                        </span>
                      ),
                    )}
                  </p>
                )}
              </div>

              {canAssign && !isAssigning && (
                <Button
                  ref={triggerRef}
                  onClick={openAssignment}
                  className="w-full min-h-[44px] sm:w-fit"
                >
                  <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
                  Asignar participantes
                </Button>
              )}

              <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                <ShieldCheck size={16} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
                Solo se muestran códigos seudonimizados y estados administrativos.
                El estado en la cohorte lo informa el sistema; esta pantalla no
                lo calcula.
              </p>
            </div>

            {canAssign && isAssigning && (
              <ParticipantAssignmentPanel
                headingRef={headingRef}
                available={available}
                unavailable={unavailable}
                isLoadingCandidates={isLoadingCandidates}
                catalogError={catalogError}
                selected={selected}
                selectionError={selectionError}
                conflicts={conflicts}
                requestError={requestError}
                isSubmitting={isSubmitting}
                onToggle={toggle}
                onRemove={remove}
                onSubmit={submit}
                onCancel={cancelAssignment}
                onRetryCatalog={retryCatalog}
              />
            )}

            {assignmentResult && (
              <ParticipantAssignmentResult
                ref={resultRef}
                assigned={assignmentResult}
                onDismiss={dismissResult}
              />
            )}

            {participantsError && (
              <CohortNotice
                tone="danger"
                icon={AlertTriangle}
                title="Participantes no disponibles"
                role="alert"
                action={
                  <Button variant="secondary" onClick={retry}>
                    <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                    Reintentar
                  </Button>
                }
              >
                {participantsError}
              </CohortNotice>
            )}

            {!participantsError && participants.length === 0 && (
              <CohortNotice tone="neutral" icon={UsersRound} title="Esta cohorte aún no tiene participantes" role="status">
                Cuando se asocien participantes a la cohorte, aparecerán aquí.
                {canAssign
                  ? ' Usa «Asignar participantes» para incorporarlos.'
                  : ' La asignación de participantes todavía no está disponible.'}
              </CohortNotice>
            )}

            {!participantsError && participants.length > 0 && (
              <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3">
                {participants.map((participant, index) => (
                  <li key={participant.id ?? participant.code ?? index}>
                    <ParticipantCard participant={participant} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
