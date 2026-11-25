import { Link } from 'react-router-dom';
import { ArrowRight, Info, MessageCircle, MessagesSquare } from 'lucide-react';

// Entrada del chat (M03): ChatEntryPage crea, reanuda o informa la
// sesión con el contrato vigente. Nunca un idSesion directo.
const CHAT_ENTRY_PATH = '/app/estudiante/chat';

const CTA_BASE =
  'inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-lg)] px-[var(--space-6)] text-[length:var(--font-size-md)] font-bold no-underline transition-[background-color,border-color,transform] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-700)] active:translate-y-px motion-reduce:transition-none sm:w-auto';

// Acción principal (registro confirmado): verde sólido, como el botón
// primario de BRISA.
const CTA_PRIMARY = `${CTA_BASE} bg-[var(--brand-500)] text-[var(--button-primary-text)] shadow-[var(--shadow-sm)] hover:bg-[var(--brand-600)] [html[data-theme="dark"]_&]:hover:bg-[var(--brand-400)]`;

// Con el registro sin confirmar, la acción principal es la del aviso de
// la cuenta: el chat sigue accesible, pero sin protagonismo.
const CTA_SECONDARY = `${CTA_BASE} border-[1.5px] border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--text-primary)] hover:border-[var(--button-secondary-hover-border)] hover:bg-[var(--button-secondary-hover-bg)]`;

/*
 * Tarjeta protagonista del inicio: el chat terapéutico es el espacio
 * principal del programa. No consulta el backend (no llama a
 * /chat/sesiones/iniciar al pintarse) ni muestra datos de sesión,
 * progreso o disponibilidad: no hay una fuente real para ellos aquí.
 */
export function TherapeuticSpaceCard({ accessConfirmed }) {
  return (
    <section
      aria-labelledby="espacio-terapeutico-titulo"
      className="relative isolate overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-[var(--space-5)] shadow-[var(--shadow-md)] md:p-[var(--space-8)]"
    >
      {/* Decoración discreta: círculos con los tokens de marca. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-[72px] -right-[56px] -z-10 h-[200px] w-[200px] rounded-[var(--radius-full)] bg-[var(--brand-100)] opacity-70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[64px] right-[96px] -z-10 hidden h-[140px] w-[140px] rounded-[var(--radius-full)] bg-[var(--brand-100)] opacity-50 md:block"
      />

      <div className="flex flex-col gap-[var(--space-5)] md:flex-row md:items-center md:justify-between md:gap-[var(--space-8)]">
        <div className="flex min-w-0 items-start gap-[var(--space-4)]">
          <span
            aria-hidden="true"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-card)] text-[var(--brand-600)] shadow-[var(--shadow-sm)] md:h-[60px] md:w-[60px]"
          >
            <MessagesSquare size={28} strokeWidth={1.7} />
          </span>

          <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
            <h2
              id="espacio-terapeutico-titulo"
              className="m-0 text-[length:var(--font-size-xl)] leading-[var(--line-height-tight)] font-extrabold text-balance text-[var(--text-primary)] md:text-[length:var(--font-size-2xl)]"
            >
              Tu espacio terapéutico
            </h2>

            <p className="m-0 max-w-[520px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-pretty text-[var(--text-secondary)] md:text-[length:var(--font-size-md)]">
              Un lugar para conversar, reflexionar y continuar tu proceso de
              dejar de vapear.
            </p>

            {!accessConfirmed && (
              <p className="m-0 flex items-start gap-[var(--space-2)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
                <Info size={16} strokeWidth={1.8} aria-hidden="true" className="mt-[3px] shrink-0" />
                El acceso al chat depende del estado de tu registro. Revisa el
                aviso de tu cuenta.
              </p>
            )}
          </div>
        </div>

        <Link
          to={CHAT_ENTRY_PATH}
          className={accessConfirmed ? CTA_PRIMARY : CTA_SECONDARY}
        >
          <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
          Ir a mi chat
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
