export const CONSENT_VERSION = '2026-06';

export function ConsentDocument() {
  return (
    <article
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
      aria-labelledby="consent-document-title"
    >
      <header className="flex justify-between border-b border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-4)]">
        <div>
          <h2
            id="consent-document-title"
            className="m-0 text-[14px] font-extrabold text-[var(--text-primary)]"
          >
            Consentimiento informado
          </h2>

          <p className="mt-[3px] mb-0 font-[var(--font-mono)] text-[10px] text-[var(--text-muted)]">
            Versión {CONSENT_VERSION}
          </p>
        </div>
      </header>

      <div className="max-h-[300px] overflow-y-auto p-[var(--space-5)] text-[12px] leading-[1.75] text-[var(--text-secondary)] [scrollbar-color:var(--neutral-300)_var(--surface-hover)] [scrollbar-width:thin]">
        <p className="m-0">
          Le invitamos a participar de manera voluntaria.
          Antes de decidir, lea atentamente la siguiente
          información:
        </p>

        <ul className="my-[var(--space-4)] flex flex-col gap-[var(--space-3)] pl-[var(--space-5)]">
          <li>
            La aplicación de las pruebas tiene fines{' '}
            <strong className="font-bold text-[var(--text-primary)]">
              académicos, formativos y de investigación
            </strong>
            , según los objetivos del proyecto institucional.
          </li>

          <li>
            Sus respuestas y resultados serán manejados con{' '}
            <strong className="font-bold text-[var(--text-primary)]">
              estricta confidencialidad
            </strong>
            , siguiendo los lineamientos éticos y legales
            vigentes.
          </li>

          <li>
            Su participación es{' '}
            <strong className="font-bold text-[var(--text-primary)]">
              voluntaria
            </strong>
            ; puede retirarse en cualquier momento, sin que
            ello genere consecuencias negativas para usted.
          </li>

          <li>
            La información recolectada será utilizada
            exclusivamente con propósitos pedagógicos y de
            investigación, de forma{' '}
            <strong className="font-bold text-[var(--text-primary)]">
              agregada y sin identificar
            </strong>{' '}
            a los participantes.
          </li>

          <li>
            Si tiene dudas o requiere información adicional,
            puede comunicarse con el equipo responsable del
            proyecto.
          </li>
        </ul>

        <p className="m-0 text-[11px] text-[var(--text-muted)]">
          Al continuar, usted declara que ha comprendido la
          información anterior y otorga su consentimiento para
          participar de manera libre y voluntaria.
        </p>
      </div>
    </article>
  );
}