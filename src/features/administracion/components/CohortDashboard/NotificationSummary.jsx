import { BellOff, MailCheck, Send } from 'lucide-react';

import { MiniStat } from './MiniStat.jsx';
import { RateGauge } from './RateGauge.jsx';
import { WidgetExplainer, WidgetGroupTitle } from './WidgetParts.jsx';

/*
 * Resumen compacto de la vista de notificaciones (RF-134) en el panel
 * RF-140. Prioriza las dos tasas (proporciones de RF-100, con su valor
 * original visible y un arco solo si están entre 0 y 1) y deja los
 * totales en una franja secundaria. Nada se recalcula ni se convierte a
 * porcentaje.
 *
 * El diseño responde al ancho REAL del widget (container queries), no al
 * de la ventana, para que el valor de cada tasa nunca se comprima:
 * - < 512 px: tasas en una columna y totales debajo;
 * - ≥ 512 px: tasas en dos columnas y totales debajo;
 * - ≥ 896 px: tasas y totales en la misma fila.
 */
export function NotificationSummary({ data }) {
  return (
    <div className="@container">
      <div className="flex flex-col gap-[var(--space-4)] @4xl:flex-row @4xl:items-start @4xl:gap-[var(--space-6)]">
        <dl className="m-0 grid min-w-0 flex-1 grid-cols-1 gap-[var(--space-3)] @lg:grid-cols-2">
          <RateGauge
            label="Tasa de apertura promedio"
            value={data.averageOpenRate}
          />
          <RateGauge
            label="Tasa de conversión promedio"
            value={data.averageConversionRate}
          />
        </dl>

        <div className="flex min-w-0 flex-col gap-[var(--space-2)] @4xl:w-[380px] @4xl:shrink-0">
          <WidgetGroupTitle>Notificaciones de la cohorte</WidgetGroupTitle>
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-2)] @sm:grid-cols-3">
            <MiniStat
              label="Enviadas"
              icon={Send}
              value={data.sentNotifications}
            />
            <MiniStat
              label="Entregadas"
              icon={MailCheck}
              value={data.deliveredNotifications}
            />
            <MiniStat
              label="Descartadas"
              icon={BellOff}
              value={data.discardedNotifications}
            />
          </dl>

          <WidgetExplainer summary="Cómo leer las tasas">
            La tasa de apertura es la proporción entre notificaciones abiertas y
            entregadas; la de conversión, entre sesiones iniciadas desde una
            notificación y notificaciones abiertas. Se muestran tal como las
            entrega el módulo de notificaciones, entre 0 y 1, sin convertirlas a
            porcentaje. «Descartadas» son notificaciones entregadas que el
            usuario descartó; por eso pueden
            contarse también entre las entregadas.
          </WidgetExplainer>
        </div>
      </div>
    </div>
  );
}
