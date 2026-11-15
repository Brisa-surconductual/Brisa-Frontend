import { CircleDashed, Info, MailOpen } from 'lucide-react';

import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { INDICATOR_STATE } from '../../types/participantTracking.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { ProfileSectionStatus } from '../ProfileSectionStatus/index.js';

/*
 * Sección «Interacción con notificaciones» de la ficha (RF-131, métricas
 * de M07). Solo presenta lo que recibe: cinco totales y tres tasas. Un
 * cero real se muestra como 0; NO_CALCULABLE como «No calculable»; un
 * dato ausente como «No disponible». Las tasas se muestran tal como
 * llegan, sin convertirlas a porcentaje: RF-131 no define su escala.
 * Nunca muestra contenido de mensajes ni eventos que las originaron.
 */
const MESSAGES = Object.freeze({
  [SECTION_STATUS.EMPTY]: Object.freeze({
    title: 'Sin historial de interacción',
    message: 'No existe historial de interacción con notificaciones para el participante consultado.',
  }),
  [SECTION_STATUS.DENIED]: Object.freeze({
    title: 'Acceso restringido a las notificaciones',
    message: 'No tiene permisos para consultar el historial de interacción con notificaciones del participante.',
  }),
  [SECTION_STATUS.PERMISSION_REQUIRED]: Object.freeze({
    title: 'Acceso restringido a las notificaciones',
    message: 'No tiene permisos para consultar el historial de interacción con notificaciones del participante.',
  }),
  [SECTION_STATUS.INCONSISTENT]: Object.freeze({
    title: 'Interacción no mostrada',
    message: 'El historial de notificaciones retornado no corresponde al participante solicitado. Por seguridad no se muestra.',
  }),
  [SECTION_STATUS.UNAVAILABLE]: Object.freeze({
    title: 'Módulo no disponible',
    message: 'El módulo de notificaciones no se encuentra disponible en este momento.',
  }),
  [SECTION_STATUS.ERROR]: Object.freeze({
    title: 'Interacción no disponible',
    message: 'No fue posible cargar el historial de interacción con notificaciones del participante.',
  }),
});

const COUNTS = Object.freeze([
  Object.freeze({ field: 'sent', label: 'Enviadas' }),
  Object.freeze({ field: 'delivered', label: 'Entregadas' }),
  Object.freeze({ field: 'opened', label: 'Abiertas' }),
  Object.freeze({ field: 'dismissed', label: 'Descartadas' }),
  Object.freeze({ field: 'sessionsFromNotification', label: 'Sesiones iniciadas desde una notificación' }),
]);

const RATES = Object.freeze([
  Object.freeze({ field: 'openRate', label: 'Tasa de apertura' }),
  Object.freeze({ field: 'conversionRate', label: 'Tasa de conversión a interacción' }),
  Object.freeze({ field: 'dismissalRate', label: 'Tasa de descarte' }),
]);

const COUNT_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const RATE_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });

function Metric({ label, metric, format }) {
  const available = metric?.state === INDICATOR_STATE.AVAILABLE;
  const notCalculable = metric?.state === INDICATOR_STATE.NOT_CALCULABLE;

  return (
    <div className="flex flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]">
      <dt className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">{label}</dt>
      <dd className="m-0">
        {available ? (
          <span className="text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums">
            {format.format(metric.value)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-md)] font-bold whitespace-nowrap text-[var(--text-secondary)]">
            {notCalculable && <CircleDashed size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />}
            {notCalculable ? 'No calculable' : 'No disponible'}
          </span>
        )}
      </dd>
    </div>
  );
}

export function NotificationInteractionSection({ interaction, status, isLoading, isDemo, retry }) {
  const showData = !isLoading && status === SECTION_STATUS.READY && interaction;

  return (
    <section aria-labelledby="interaccion-notificaciones" className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2 id="interaccion-notificaciones" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          <MailOpen size={20} strokeWidth={1.8} aria-hidden="true" />
          Interacción con notificaciones
        </h2>
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Métricas expuestas por el módulo de notificaciones. No incluyen el
          contenido de los mensajes ni se recalculan desde aquí.
        </p>
      </div>

      <ProfileSectionStatus
        status={status}
        isLoading={isLoading}
        messages={MESSAGES}
        loadingLabel="Cargando la interacción con notificaciones..."
        retryLabel="Reintentar notificaciones"
        retry={retry}
        isDemo={isDemo}
      />

      {showData && (
        <>
          {interaction.hasNotCalculable && (
            <CohortNotice tone="info" icon={Info} title="Métricas parciales" role="note">
              Algunas métricas de interacción con notificaciones no se encuentran
              disponibles para el periodo consultado.
            </CohortNotice>
          )}

          <div className="flex flex-col gap-[var(--space-2)]">
            <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">Totales</h3>
            <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {COUNTS.map(({ field, label }) => (
                <Metric key={field} label={label} metric={interaction.counts[field]} format={COUNT_FORMAT} />
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-[var(--space-2)]">
            <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">Tasas</h3>
            <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
              {RATES.map(({ field, label }) => (
                <Metric key={field} label={label} metric={interaction.rates[field]} format={RATE_FORMAT} />
              ))}
            </dl>
            <p className="m-0 text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
              Valores tal como los expone el módulo de notificaciones, sin
              convertir a porcentaje: su escala está pendiente de confirmar.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
