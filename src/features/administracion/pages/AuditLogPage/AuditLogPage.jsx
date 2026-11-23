import {
  AlertTriangle,
  FlaskConical,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { AuditEntryCard } from '../../components/AuditEntryCard/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';

import { useAuditLog } from './hooks/useAuditLog.js';

/*
 * Consulta de la bitácora de auditoría (/administrativo/auditoria,
 * RF-123). Solo lectura: no crea, modifica, elimina ni exporta
 * registros. La autorización real de la consulta es del backend; aquí
 * solo se presenta su resultado. La página solo compone; el estado vive
 * en useAuditLog.
 */
export function AuditLogPage() {
  const {
    entries, isLoading, isLoadingMore, loadError, isDenied, isDemo,
    isSessionExpired, hasMore, retry, loadMore,
  } = useAuditLog();

  const hasEntries = !isLoading && !isDenied && !isSessionExpired && entries.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <header className="flex flex-col gap-[var(--space-1)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración
        </p>

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Auditoría
        </h1>

        <p className="mt-[var(--space-1)] mb-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Consulta los registros de accesos y acciones realizadas en el módulo
          administrativo.
        </p>
      </header>

      <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
        <ShieldCheck size={16} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
        Registros de solo lectura: no pueden crearse, modificarse ni eliminarse
        desde esta pantalla. Solo se muestran la fecha y hora, la acción, el
        recurso afectado y el estado.
      </p>

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Registros de demostración. No representan acciones reales ni las
          operaciones realizadas en este entorno.
        </CohortNotice>
      )}

        <section aria-labelledby="registros-auditoria" aria-busy={isLoading || isLoadingMore} className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
            <h2 id="registros-auditoria" className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
              Registros
            </h2>

            {hasEntries && (
              <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                {entries.length} {entries.length === 1 ? 'registro' : 'registros'} · hora de Colombia
              </p>
            )}
          </div>

          {isLoading && (
            <>
              <p role="status" className="sr-only">
                Cargando registros de auditoría...
              </p>
              <ul className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <li
                    key={index}
                    className="h-[88px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none md:h-[64px]"
                  />
                ))}
              </ul>
            </>
          )}

          {!isLoading && isDenied && (
            <CohortNotice tone="warning" icon={ShieldX} title="Acceso denegado" role="alert">
              No tiene permisos para realizar esta acción administrativa.
              {isDemo && ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.'}
            </CohortNotice>
          )}

          {!isLoading && isSessionExpired && (
            <CohortNotice tone="warning" icon={ShieldX} title="Sesión vencida" role="alert">
              Vuelve a iniciar sesión para consultar la bitácora.
            </CohortNotice>
          )}

          {!isLoading && loadError && (
            <CohortNotice
              tone="danger"
              icon={AlertTriangle}
              title={entries.length ? 'No se pudieron cargar más registros' : 'Registros no disponibles'}
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

          {!isLoading && !loadError && !isDenied && !isSessionExpired && entries.length === 0 && (
            <CohortNotice tone="neutral" icon={ScrollText} title="Aún no hay registros de auditoría" role="status">
              Cuando se registren accesos o acciones del módulo administrativo,
              aparecerán en esta consulta.
            </CohortNotice>
          )}

          {hasEntries && (
            <ol className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
              {entries.map((entry, index) => (
                <li key={entry.id || index}>
                  <AuditEntryCard entry={entry} />
                </li>
              ))}
            </ol>
          )}
          {hasEntries && hasMore && !loadError && (
            <div className="self-start">
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Cargando más registros…' : 'Cargar más registros'}
              </Button>
            </div>
          )}
        </section>
    </div>
  );
}
