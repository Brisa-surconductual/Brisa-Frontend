import { Award, BookMarked, BookOpen, CircleHelp, Milestone } from 'lucide-react';

import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { ProfileSectionStatus } from '../ProfileSectionStatus/index.js';

/*
 * Sección «Progresión narrativa» de la ficha (RF-130, datos de M06).
 * Solo presenta lo que recibe: fase activa, último capítulo completado
 * y logros desbloqueados. No calcula ni completa valores, no muestra
 * identificadores, nivel de gamificación ni reglas de desbloqueo, y no
 * ofrece acciones. Textos de RF-130 cuando los define.
 */
const MESSAGES = Object.freeze({
  [SECTION_STATUS.EMPTY]: Object.freeze({
    title: 'Sin progresión narrativa',
    message: 'No existe progresión narrativa disponible para el participante consultado.',
  }),
  [SECTION_STATUS.DENIED]: Object.freeze({
    title: 'Acceso restringido a la progresión narrativa',
    message: 'No tiene permisos para consultar la progresión narrativa individual del participante.',
  }),
  [SECTION_STATUS.PERMISSION_REQUIRED]: Object.freeze({
    title: 'Permiso explícito requerido',
    message: 'Se requiere permiso explícito para consultar la progresión narrativa individual.',
  }),
  [SECTION_STATUS.INCONSISTENT]: Object.freeze({
    title: 'Progresión narrativa no mostrada',
    message: 'La progresión narrativa retornada no corresponde al participante solicitado. Por seguridad no se muestra.',
  }),
  [SECTION_STATUS.UNAVAILABLE]: Object.freeze({
    title: 'Módulo no disponible',
    message: 'El módulo de gamificación no se encuentra disponible en este momento.',
  }),
  [SECTION_STATUS.ERROR]: Object.freeze({
    title: 'Progresión narrativa no disponible',
    message: 'No fue posible cargar la progresión narrativa individual del participante.',
  }),
});

const NOT_AVAILABLE = 'No disponible';

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <dt className="inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={`m-0 [overflow-wrap:anywhere] ${value ? 'text-[length:var(--font-size-lg)] font-bold text-[var(--text-primary)]' : 'text-[length:var(--font-size-md)] font-semibold text-[var(--text-secondary)]'}`}
      >
        {value ?? NOT_AVAILABLE}
      </dd>
    </div>
  );
}

function Achievements({ achievements }) {
  if (achievements === null) {
    return (
      <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
        No disponible
      </p>
    );
  }

  if (achievements.length === 0) {
    return (
      <p className="m-0 inline-flex w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-secondary)]">
        <Award size={16} strokeWidth={2} aria-hidden="true" />
        Sin logros narrativos desbloqueados
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
      {achievements.map((achievement, index) => {
        const unlockedLabel = formatAuditTimestamp(achievement.unlockedAt);

        return (
          <li
            key={`${index}-${achievement.name}`}
            className="flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-1)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--text-primary)]"
          >
            <span className="inline-flex min-w-0 items-center gap-[var(--space-2)] font-bold [overflow-wrap:anywhere]">
              <Award size={16} strokeWidth={2} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
              {achievement.name ?? 'Logro sin nombre disponible'}
            </span>
            {achievement.unlockedAt && (
              <span className="text-[var(--text-secondary)] tabular-nums">
                {unlockedLabel ? (
                  <>
                    Desbloqueado el <time dateTime={achievement.unlockedAt}>{unlockedLabel}</time>
                  </>
                ) : (
                  'Fecha no disponible'
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NarrativeProgressSection({ narrative, status, isLoading, isDemo, retry }) {
  const showData = !isLoading && status === SECTION_STATUS.READY && narrative;

  return (
    <section aria-labelledby="progresion-narrativa" className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2 id="progresion-narrativa" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          <BookOpen size={20} strokeWidth={1.8} aria-hidden="true" />
          Progresión narrativa
        </h2>
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Estado narrativo expuesto por el módulo de gamificación. Se muestra tal
          como llega: no se calcula ni se modifica desde aquí.
        </p>
      </div>

      <ProfileSectionStatus
        status={status}
        isLoading={isLoading}
        messages={MESSAGES}
        loadingLabel="Cargando la progresión narrativa..."
        retryLabel="Reintentar progresión"
        retry={retry}
        isDemo={isDemo}
      />

      {showData && (
        <>
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
            <Field icon={Milestone} label="Fase narrativa activa" value={narrative.activePhaseName} />
            <Field icon={BookMarked} label="Último capítulo completado" value={narrative.lastCompletedChapterName} />
          </dl>

          <div className="flex flex-col gap-[var(--space-2)]">
            <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
              Logros narrativos desbloqueados
              {Array.isArray(narrative.achievements) && (
                <span className="ml-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                  ({narrative.achievements.length})
                </span>
              )}
            </h3>
            <Achievements achievements={narrative.achievements} />
          </div>
        </>
      )}
    </section>
  );
}
