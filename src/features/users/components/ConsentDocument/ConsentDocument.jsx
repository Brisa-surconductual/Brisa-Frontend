import { FileText } from 'lucide-react';

export const CONSENT_VERSION = '2026-06';

/*
 * Documento legal: el texto se muestra tal cual llega del backend,
 * un párrafo por línea, sin resumir ni reformular. La zona de
 * lectura es enfocable para poder desplazarla con el teclado.
 */
export function ConsentDocument({ titulo, contenido, version }) {
  const displayTitle = titulo || "Consentimiento informado";
  const displayVersion = version || CONSENT_VERSION;
  const displayContent = contenido || "Cargando documento...";

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
      aria-labelledby="consent-document-title"
    >
      <header className="flex items-start gap-[var(--space-3)] border-b border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-5)] py-[var(--space-4)]">
        <span
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <FileText size={18} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <h2
            id="consent-document-title"
            className="m-0 text-[length:var(--font-size-md)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]"
          >
            {displayTitle}
          </h2>

          <p className="mt-[2px] mb-0 font-[var(--font-mono)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            Versión {displayVersion}
          </p>
        </div>
      </header>

      <div
        // Región desplazable: recibe foco para leerla con el teclado.
        tabIndex={0}
        role="region"
        aria-label="Texto del consentimiento informado"
        className="max-h-[360px] overflow-y-auto px-[var(--space-5)] py-[var(--space-4)] text-[length:var(--font-size-sm)] leading-[var(--line-height-relaxed)] text-[var(--text-secondary)] [scrollbar-color:var(--neutral-300)_var(--surface-hover)] [scrollbar-width:thin] focus-visible:outline-offset-[-3px] md:max-h-[420px]"
      >
        {displayContent.split('\n').map((paragraph, index) => (
          <p key={index} className="m-0 mb-[var(--space-3)]">
            {paragraph}
          </p>
        ))}

        <p className="m-0 mt-[var(--space-4)] border-t border-[var(--surface-border)] pt-[var(--space-3)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          Al continuar, usted declara que ha comprendido la
          información anterior y otorga su consentimiento para
          participar de manera libre y voluntaria.
        </p>
      </div>
    </article>
  );
}
