import {
  AlertTriangle,
  CloudOff,
  EyeOff,
  Hourglass,
  RefreshCw,
  SearchX,
  ShieldAlert,
  Timer,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { AGGREGATE_VIEW_STATUS as S } from '../../types/behavioralAggregate.js';
import { SECTION_OUTCOME } from '../../types/cohortDashboard.js';
import { CohortNotice } from '../CohortNotice/index.js';

function RetryButton({ onRetry }) {
  return (
    <Button variant="secondary" size="small" onClick={onRetry}>
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      Reintentar
    </Button>
  );
}

/*
 * Estado sin datos de un widget del panel (RF-140), en versión compacta.
 * Conserva los mismos casos que la vista detallada (sin consolidar,
 * suprimido, no disponible, inconsistente, inexistente, error) y los del
 * panel (la fuente no respondió o superó el tiempo límite). Sin
 * consolidación es un estado funcional: sin alerta ni reintento.
 */
export function WidgetStateNotice({
  outcome,
  view,
  dimension,
  moduleLabel,
  onRetry,
}) {
  if (
    outcome === SECTION_OUTCOME.TIMEOUT ||
    outcome === SECTION_OUTCOME.REJECTED
  ) {
    const isTimeout = outcome === SECTION_OUTCOME.TIMEOUT;

    return (
      <CohortNotice
        tone="warning"
        icon={isTimeout ? Timer : CloudOff}
        title={`Vista de ${dimension} no disponible`}
        role="alert"
        action={<RetryButton onRetry={onRetry} />}
      >
        {isTimeout
          ? `La vista de ${dimension} no respondió a tiempo. Se muestra el panorama con la información restante disponible.`
          : `La vista de ${dimension} no está disponible en este momento. Se muestra el panorama con la información restante disponible.`}
      </CohortNotice>
    );
  }

  switch (view?.status) {
    case S.NOT_CONSOLIDATED:
      return (
        <CohortNotice
          tone="neutral"
          icon={Hourglass}
          title="Aún sin datos consolidados"
          role="status"
        >
          {view.message ??
            `La vista de ${dimension} todavía no tiene datos consolidados para esta cohorte.`}
        </CohortNotice>
      );

    case S.SUPPRESSED:
      return (
        <CohortNotice
          tone="neutral"
          icon={EyeOff}
          title="Vista no mostrada por privacidad"
          role="status"
        >
          {view.message ??
            `El módulo de ${moduleLabel} no entrega esta vista para proteger la privacidad de los participantes.`}
        </CohortNotice>
      );

    case S.UNAVAILABLE:
      return (
        <CohortNotice
          tone="warning"
          icon={CloudOff}
          title="Vista no disponible"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          {`El módulo de ${moduleLabel} no está disponible en este momento y no hay una vista anterior para mostrar.`}
        </CohortNotice>
      );

    case S.INCONSISTENT:
      return (
        <CohortNotice
          tone="danger"
          icon={ShieldAlert}
          title="Vista no mostrada"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          La información recibida no corresponde a la cohorte activa. Por
          seguridad no se muestra.
        </CohortNotice>
      );

    case S.NOT_FOUND:
      return (
        <CohortNotice
          tone="neutral"
          icon={SearchX}
          title="Cohorte no encontrada"
          role="alert"
        >
          La cohorte solicitada no existe en el sistema.
        </CohortNotice>
      );

    default:
      return (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title={`No pudimos cargar la vista de ${dimension}`}
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          Intenta nuevamente en unos momentos.
        </CohortNotice>
      );
  }
}
