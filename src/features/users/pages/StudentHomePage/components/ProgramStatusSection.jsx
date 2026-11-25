import { ClipboardCheck } from 'lucide-react';

import { AssignedScheduleSummary } from '@/features/cronograma/components/AssignedScheduleSummary/index.js';

import { RegistrationStatusNotice } from './RegistrationStatusNotice.jsx';

/*
 * «Estado del programa»: con el registro confirmado, el aviso de la
 * cuenta en su versión compacta. El cronograma asignado se muestra
 * aparte, con su propia consulta y sus estados reales: un registro
 * completo no implica un cronograma activo. Los estados que piden
 * atención (consentimiento, revisión, sesión limitada, desconocido)
 * se muestran arriba, completos, fuera de esta sección.
 */
export function ProgramStatusSection({ showRegistration, view, estadoRegistro, onGoToConsent }) {
  return (
    <section
      aria-labelledby="estado-programa-titulo"
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <span
          aria-hidden="true"
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
        >
          <ClipboardCheck size={20} strokeWidth={1.8} />
        </span>

        <h2
          id="estado-programa-titulo"
          className="m-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold text-[var(--text-primary)]"
        >
          Estado del programa
        </h2>
      </div>

      {showRegistration && (
        <RegistrationStatusNotice
          variant="compact"
          view={view}
          estadoRegistro={estadoRegistro}
          onGoToConsent={onGoToConsent}
        />
      )}

      <AssignedScheduleSummary />
    </section>
  );
}
