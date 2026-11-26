import {
  AlertTriangle,
  CloudOff,
  EyeOff,
  Hourglass,
  RefreshCw,
  SearchX,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { AGGREGATE_VIEW_STATUS as STATUS } from '../../types/behavioralAggregate.js';
import { CohortNotice } from '../CohortNotice/index.js';

function resolveNotice(view, copy) {
  switch (view?.status) {
    case STATUS.NOT_CONSOLIDATED:
      return {
        tone: 'neutral',
        icon: Hourglass,
        role: 'status',
        title: copy.pendingTitle,
        message: view.message ?? copy.NOT_CONSOLIDATED,
      };
    case STATUS.SUPPRESSED:
      return {
        tone: 'neutral',
        icon: EyeOff,
        role: 'status',
        title: 'Vista no mostrada por privacidad',
        message: view.message ?? copy.SUPPRESSED,
      };
    case STATUS.UNAVAILABLE:
      return {
        tone: 'warning',
        icon: CloudOff,
        title: copy.unavailableTitle,
        message: copy.UNAVAILABLE,
        canRetry: true,
      };
    case STATUS.INCONSISTENT:
      return {
        tone: 'danger',
        icon: ShieldAlert,
        title: 'Vista no mostrada',
        message:
          'La información recibida no corresponde a la cohorte solicitada. Por seguridad no se muestra.',
        canRetry: true,
      };
    case STATUS.NOT_FOUND:
      return {
        tone: 'neutral',
        icon: SearchX,
        title: view.message
          ? 'Cohorte activa no disponible'
          : 'Cohorte no encontrada',
        message:
          view.message ?? 'La cohorte solicitada no existe en el sistema.',
      };
    default:
      return {
        tone: 'danger',
        icon: AlertTriangle,
        title: copy.errorTitle,
        message: copy.ERROR,
        canRetry: true,
      };
  }
}

export function AggregateViewNotice({ view, copy, onRetry }) {
  const {
    tone,
    icon,
    title,
    role = 'alert',
    message,
    canRetry,
  } = resolveNotice(view, copy);
  const action = canRetry ? (
    <Button variant="secondary" onClick={onRetry}>
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      Reintentar
    </Button>
  ) : null;

  return (
    <CohortNotice
      tone={tone}
      icon={icon}
      title={title}
      role={role}
      action={action}
    >
      {message}
    </CohortNotice>
  );
}
