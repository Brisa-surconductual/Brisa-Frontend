export const CONSENT_VERSION = '2026-06';

export function ConsentDocument({ titulo, contenido, version }) {
  const displayTitle = titulo || "Consentimiento informado";
  const displayVersion = version || CONSENT_VERSION;
  const displayContent = contenido || "Cargando documento...";

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
            {displayTitle}
          </h2>

          <p className="mt-[3px] mb-0 font-[var(--font-mono)] text-[10px] text-[var(--text-muted)]">
            Versión {displayVersion}
          </p>
        </div>
      </header>

      <div className="max-h-[300px] overflow-y-auto p-[var(--space-5)] text-[12px] leading-[1.75] text-[var(--text-secondary)] [scrollbar-color:var(--neutral-300)_var(--surface-hover)] [scrollbar-width:thin]">
        
  
        {displayContent.split('\n').map((paragraph, index) => (
          <p key={index} className="m-0 mb-[var(--space-3)]">
            {paragraph}
          </p>
        ))}



        <p className="m-0 mt-[var(--space-4)] text-[11px] text-[var(--text-muted)] border-t border-[var(--surface-border)] pt-2">
          Al continuar, usted declara que ha comprendido la
          información anterior y otorga su consentimiento para
          participar de manera libre y voluntaria.
        </p>
      </div>
    </article>
  );
}