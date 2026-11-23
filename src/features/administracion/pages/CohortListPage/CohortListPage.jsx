import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CircleCheck,
  CirclePause,
  CirclePlay,
  FlaskConical,
  Layers,
  PlugZap,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { CohortCard } from '../../components/CohortCard/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';
import { COHORT_TRANSITION, getAvailableTransitions } from '../../services/cohortTransitions.js';
import { COHORT_STATUS } from '../../types/cohortStatus.js';

import { useCohortList } from './hooks/useCohortList.js';
import { useCohortSaveNotice } from './hooks/useCohortSaveNotice.js';
import { useCohortStatusActions } from './hooks/useCohortStatusActions.js';

const COHORT_LIST_PATH = '/app/administrativo/cohortes';

function getDetailPath(cohort) {
  return `${COHORT_LIST_PATH}/${encodeURIComponent(cohort.id)}`;
}

function getEditPath(cohort) {
  return `${getDetailPath(cohort)}/editar`;
}

const SAVE_NOTICE_TITLE = Object.freeze({
  create: 'Cohorte creada',
  edit: 'Cambios aplicados',
});

// Acción de estado que ofrece cada transición definida (RF-124).
const STATUS_ACTION = Object.freeze({
  [COHORT_TRANSITION.ACTIVATE]: Object.freeze({ label: 'Activar', busyLabel: 'Activando...', icon: CirclePlay }),
  [COHORT_TRANSITION.INACTIVATE]: Object.freeze({ label: 'Inactivar', busyLabel: 'Inactivando...', icon: CirclePause }),
});

const NOTICE_ICON = Object.freeze({ success: CircleCheck, warning: AlertTriangle, danger: AlertTriangle });

const STATUS_SUMMARY = Object.freeze([
  Object.freeze({ status: COHORT_STATUS.ACTIVE, singular: 'activa', plural: 'activas' }),
  Object.freeze({ status: COHORT_STATUS.DRAFT, singular: 'en borrador', plural: 'en borrador' }),
  Object.freeze({ status: COHORT_STATUS.INACTIVE, singular: 'inactiva', plural: 'inactivas' }),
]);

/*
 * Consulta de cohortes (RF-124) con acceso a su creación, edición y
 * cambio de estado cuando la fuente lo admite.
 */
export function CohortListPage() {
  const navigate = useNavigate();
  const saveNotice = useCohortSaveNotice();
  const {
    cohorts,
    statusCounts,
    isLoading,
    loadError,
    isDemo,
    isIntegrationPending,
    canManage,
    retry,
    replaceCohort,
  } = useCohortList();
  const {
    busyIds,
    notice: statusNotice,
    noticeRef,
    pendingInactivation,
    requestActivation,
    requestInactivation,
    cancelInactivation,
    confirmInactivation,
  } = useCohortStatusActions({ onCohortChanged: replaceCohort, isDemo });

  const hasCohorts = !isLoading && !loadError && cohorts.length > 0;

  function getStatusAction(cohort) {
    const [transition] = getAvailableTransitions(cohort);
    const action = STATUS_ACTION[transition];

    if (!canManage || !cohort.id || !action) return null;

    return {
      ...action,
      ...(cohort.status === COHORT_STATUS.INACTIVE && {
        label: 'Reactivar',
        busyLabel: 'Reactivando...',
      }),
      busy: busyIds.includes(cohort.id),
      onClick: () =>
        transition === COHORT_TRANSITION.ACTIVATE
          ? requestActivation(cohort)
          : requestInactivation(cohort),
    };
  }


  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-8)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-[var(--space-1)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración
        </p>

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Cohortes
        </h1>

        <p className="mt-[var(--space-1)] mb-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Consulta los grupos de participantes del programa, su periodo y el
          cronograma psicoeducativo asociado.
        </p>
        </div>

        {canManage && (
          <Button onClick={() => navigate(`${COHORT_LIST_PATH}/nueva`)} className="w-full md:w-auto md:shrink-0 md:whitespace-nowrap">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Nueva cohorte
          </Button>
        )}
      </header>

      {isDemo && (
        <CohortNotice
          tone="warning"
          icon={FlaskConical}
          title="Datos de demostración"
          role="note"
        >
          Estás viendo cohortes ficticias del modo de desarrollo. No provienen
          del servidor ni representan participantes reales. Los cambios son
          temporales y no se guardan en el servidor.
        </CohortNotice>
      )}

      {saveNotice && !isIntegrationPending && (
        <CohortNotice
          tone="success"
          icon={CircleCheck}
          title={`${SAVE_NOTICE_TITLE[saveNotice.action] ?? SAVE_NOTICE_TITLE.edit}${isDemo ? ' temporalmente' : ''}`}
          role="status"
        >
          «{saveNotice.name}» ya aparece en el listado.
        </CohortNotice>
      )}

      {statusNotice && (
        <CohortNotice
          ref={noticeRef}
          tabIndex={-1}
          tone={statusNotice.tone}
          icon={NOTICE_ICON[statusNotice.tone]}
          title={statusNotice.title}
          role={statusNotice.tone === 'success' ? 'status' : 'alert'}
        >
          {statusNotice.message}
        </CohortNotice>
      )}

      {isIntegrationPending ? (
        <CohortNotice
          tone="info"
          icon={PlugZap}
          title="Integración pendiente"
          role="status"
        >
          La consulta de cohortes todavía no está conectada al servidor. Cuando
          se integre, aquí aparecerán las cohortes registradas.
        </CohortNotice>
      ) : (
        <section
          aria-labelledby="listado-cohortes"
          aria-busy={isLoading}
          className="flex flex-col gap-[var(--space-4)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
            <h2
              id="listado-cohortes"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Todas las cohortes
            </h2>

            {hasCohorts && (
              <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                {cohorts.length} {cohorts.length === 1 ? 'cohorte' : 'cohortes'}
                {STATUS_SUMMARY.filter(({ status }) => statusCounts[status] > 0).map(
                  ({ status, singular, plural }) => (
                    <span key={status}>
                      {' · '}
                      {statusCounts[status]}{' '}
                      {statusCounts[status] === 1 ? singular : plural}
                    </span>
                  ),
                )}
              </p>
            )}
          </div>

          {isLoading && (
            <>
              <p role="status" className="sr-only">
                Cargando cohortes...
              </p>

              <ul
                className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3"
                aria-hidden="true"
              >
                {[0, 1, 2].map((index) => (
                  <li
                    key={index}
                    className="h-[184px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                  />
                ))}
              </ul>
            </>
          )}

          {!isLoading && loadError && (
            <CohortNotice
              tone="danger"
              icon={AlertTriangle}
              title="Cohortes no disponibles"
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

          {!isLoading && !loadError && cohorts.length === 0 && (
            <CohortNotice
              tone="neutral"
              icon={Layers}
              title="Aún no hay cohortes"
              role="status"
            >
              Cuando se registren cohortes del programa, aparecerán en este
              listado.
            </CohortNotice>
          )}

          {hasCohorts && (
            <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3">
              {cohorts.map((cohort, index) => (
                <li key={cohort.id ?? index}>
                  <CohortCard
                    cohort={cohort}
                    detailPath={cohort.id ? getDetailPath(cohort) : null}
                    editPath={canManage && cohort.id ? getEditPath(cohort) : null}
                    statusAction={getStatusAction(cohort)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canManage && (
        <ConfirmationDialog
          open={Boolean(pendingInactivation)}
          title={pendingInactivation ? `¿Inactivar «${pendingInactivation.name}»?` : 'Inactivar cohorte'}
          description={isDemo
            ? 'La cohorte pasará a estado Inactiva. Los cambios son temporales y no se guardan en el servidor.'
            : 'La cohorte pasará a estado Inactiva. Podrás reactivarla si su cronograma está activo.'}
          confirmText="Inactivar cohorte"
          cancelText="Cancelar"
          onConfirm={confirmInactivation}
          onCancel={cancelInactivation}
        />
      )}
    </div>
  );
}
