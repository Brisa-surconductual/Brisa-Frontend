import { Link, Navigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CircleCheck,
  CloudOff,
  FlaskConical,
  Info,
  Layers,
  RefreshCw,
  SearchX,
  ShieldX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { AttendAlertDialog } from '../../components/AttendAlertDialog/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';
import { PendingAlertList } from '../../components/PendingAlertList/index.js';
import { TrackingPagination } from '../../components/TrackingPagination/index.js';
import {
  PENDING_ALERT_FILTERS,
  PENDING_ALERTS_STATUS as S,
} from '../../types/pendingAlerts.js';
import { COHORTS_PATH, getCohortDetailPath } from '../../utils/cohortRoutes.js';

import { usePendingAlerts } from './hooks/usePendingAlerts.js';

const LOGIN_PATH = '/login';

// Avisos de los estados sin lista. El texto es el `mensaje` del backend
// cuando llega; si no, el respaldo (ADR-0004).
const STATUS_NOTICE = Object.freeze({
  [S.INVALID_REQUEST]: { tone: 'warning', icon: AlertTriangle, title: 'Solicitud no válida', text: 'Los datos de la consulta no son válidos.' },
  [S.DENIED]: { tone: 'warning', icon: ShieldX, title: 'Acceso denegado', text: 'No tienes permisos para consultar las alertas de esta cohorte.' },
  [S.COHORT_NOT_FOUND]: { tone: 'neutral', icon: SearchX, title: 'Cohorte no encontrada', text: 'La cohorte solicitada no existe.' },
  [S.SOURCE_UNAVAILABLE]: { tone: 'warning', icon: CloudOff, title: 'Alertas no disponibles', text: 'El módulo de seguimiento no está disponible en este momento.' },
  [S.CONNECTION_ERROR]: { tone: 'warning', icon: CloudOff, title: 'Sin conexión', text: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.' },
  [S.SERVER_ERROR]: { tone: 'danger', icon: AlertTriangle, title: 'No se pudieron cargar las alertas', text: 'Ocurrió un error inesperado. Inténtalo de nuevo.' },
  [S.INVALID_RESPONSE]: { tone: 'danger', icon: AlertTriangle, title: 'Respuesta no válida', text: 'La respuesta del servidor no tiene el formato esperado. No se muestra información parcial.' },
});

const totalText = (total) => (total === 1 ? '1 alerta pendiente' : `${total} alertas pendientes`);

// Se monta de nuevo al cambiar de cohorte: la bandeja de otra cohorte
// nunca queda visible ni se mezcla con la nueva.
export function PendingAlertsPage() {
  const { idCohorte } = useParams();

  return <PendingAlerts key={idCohorte ?? ''} />;
}

/*
 * Bandeja de alertas pendientes de una cohorte
 * (/cohortes/:idCohorte/alertas/pendientes, RF-146) con la acción
 * «Marcar como atendida» (RF-147). La página compone; el estado vive en
 * usePendingAlerts.
 */
function PendingAlerts() {
  const { idCohorte } = useParams();
  const cohortId = idCohorte ?? null;
  const {
    cohort, isDemo, status, message, canRetry, page, pagination, filter, busy, notice,
    requiresRefresh, dialog, changeFilter, goBack, goForward, retry, refresh, openAttend,
    changeReason, cancelAttend, confirmAttend,
  } = usePendingAlerts({ cohortId });

  // 401: se respeta la autenticación existente.
  if (status === S.UNAUTHENTICATED) return <Navigate to={LOGIN_PATH} replace />;

  const cohortName = cohort?.name?.trim();
  const statusNotice = STATUS_NOTICE[status];
  const showFilters = !isDemo && [S.READY, S.EMPTY, S.LOADING].includes(status);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={cohortId ? getCohortDetailPath(cohortId) : COHORTS_PATH}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Volver a la cohorte
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Cohortes
        </p>
        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Alertas pendientes
        </h1>
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Alertas de craving elevado e inactividad de la cohorte que aún no
          han sido atendidas por el equipo de psicología.
        </p>
      </header>

      {cohortName && (
        <p className="m-0 flex min-w-0 items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]">
          <Layers size={20} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
              Cohorte consultada
            </span>
            <span className="text-[length:var(--font-size-lg)] leading-[var(--line-height-tight)] font-extrabold break-words text-[var(--text-primary)]">
              {cohortName}
            </span>
          </span>
        </p>
      )}

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="No disponible en la demostración" role="note">
          Las cohortes de la demostración son ficticias. La gestión de alertas
          solo funciona con cohortes reales: aquí no se consulta ni se registra
          ninguna atención.
        </CohortNotice>
      )}

      {/* Resultado de la última atención (éxito, conflicto o incertidumbre). */}
      <div aria-live="polite" className="empty:hidden">
        {notice && (
          <CohortNotice
            tone={notice.tone}
            icon={notice.tone === 'success' ? CircleCheck : notice.tone === 'danger' ? AlertTriangle : Info}
            role={notice.tone === 'danger' ? 'alert' : 'status'}
            action={
              requiresRefresh && (
                <Button variant="secondary" onClick={refresh} disabled={busy} className="shrink-0">
                  <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
                  Actualizar alertas
                </Button>
              )
            }
          >
            {notice.text}
          </CohortNotice>
        )}
      </div>

      {showFilters && (
        <fieldset className="m-0 flex min-w-0 flex-col gap-[var(--space-2)] border-0 p-0">
          <legend className="mb-[var(--space-2)] p-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
            Tipo de alerta
          </legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {PENDING_ALERT_FILTERS.map(({ value, label }) => {
              const checked = filter === value;

              return (
                <label
                  key={label}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-full)] border px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--brand-600)] motion-reduce:transition-none ${
                    checked
                      ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]'
                      : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo-alerta"
                    className="sr-only"
                    checked={checked}
                    disabled={busy}
                    onChange={() => changeFilter(value)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {status === S.LOADING && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-3)]">
          <p role="status" className="sr-only">Consultando alertas pendientes...</p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-[92px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-hover)] motion-reduce:animate-none"
            />
          ))}
        </div>
      )}

      {status === S.EMPTY && (
        <CohortNotice tone="neutral" icon={CircleCheck} title="Sin alertas pendientes" role="status">
          {filter
            ? 'No hay alertas pendientes de este tipo en la cohorte.'
            : 'No hay alertas pendientes en la cohorte.'}
        </CohortNotice>
      )}

      {statusNotice && (
        <CohortNotice
          tone={statusNotice.tone}
          icon={statusNotice.icon}
          title={statusNotice.title}
          role="alert"
          action={
            canRetry && (
              <Button variant="secondary" onClick={retry} className="shrink-0">
                <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
                Reintentar
              </Button>
            )
          }
        >
          {status === S.INVALID_RESPONSE || status === S.CONNECTION_ERROR
            ? statusNotice.text
            : message || statusNotice.text}
        </CohortNotice>
      )}

      {page && pagination && (
        <section aria-labelledby="bandeja-alertas" className="flex flex-col gap-[var(--space-4)]">
          <h2 id="bandeja-alertas" className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
            {totalText(page.total)}
          </h2>

          <PendingAlertList
            alerts={page.items}
            actionsDisabled={busy || requiresRefresh}
            onAttend={openAttend}
          />

          {pagination.pageCount > 1 && (
            <TrackingPagination
              label="Paginación de alertas pendientes"
              unit={['alerta', 'alertas']}
              range={pagination.range}
              total={page.total}
              pageNumber={pagination.pageNumber}
              pageCount={pagination.pageCount}
              canGoBack={pagination.canGoBack}
              canGoForward={pagination.canGoForward}
              disabled={busy}
              onBack={goBack}
              onForward={goForward}
            />
          )}
        </section>
      )}

      <AttendAlertDialog
        dialog={dialog}
        onChangeReason={changeReason}
        onCancel={cancelAttend}
        onConfirm={confirmAttend}
      />
    </div>
  );
}
