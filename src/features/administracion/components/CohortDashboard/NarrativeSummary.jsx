import { Award, GraduationCap, Trophy, UsersRound } from 'lucide-react';

import { NARRATIVE_PHASE } from '../../types/narrativeAggregate.js';

import { BarList } from './BarList.jsx';
import { MiniStat } from './MiniStat.jsx';
import { WidgetGroupTitle } from './WidgetParts.jsx';

const PHASE_LABEL = Object.freeze({
  [NARRATIVE_PHASE.START]: 'Inicio',
  [NARRATIVE_PHASE.DEVELOPMENT]: 'Desarrollo',
  [NARRATIVE_PHASE.CLOSING]: 'Cierre',
});

/*
 * Resumen compacto de la vista narrativa (RF-133) en el panel RF-140.
 * Solo presenta la vista ya interpretada por su servicio: distribución
 * por fase en barras (cantidades originales, sin porcentajes ni sumas),
 * y graduaciones y logros tal como llegan.
 */
export function NarrativeSummary({ data }) {
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex flex-col gap-[var(--space-2)]">
        <WidgetGroupTitle>Usuarios por fase narrativa</WidgetGroupTitle>
        {data.phaseDistribution ? (
          <BarList
            label="Usuarios por fase narrativa"
            items={data.phaseDistribution.map(({ phase, users }) => ({
              key: phase,
              label: PHASE_LABEL[phase],
              value: users,
            }))}
          />
        ) : (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
            Distribución no disponible: no llegó en un formato válido.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <WidgetGroupTitle>Graduación y logros</WidgetGroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-2)] sm:grid-cols-3">
          <MiniStat
            label="Programa completado"
            icon={GraduationCap}
            value={data.completedProgramUsers}
          />
          <MiniStat
            label="Usuarios con logros"
            icon={Award}
            value={data.usersWithAchievements}
          />
          <MiniStat
            label="Logros desbloqueados"
            icon={Trophy}
            value={data.unlockedAchievements}
          />
          {data.cohortUsers !== null && (
            <MiniStat
              label="Usuarios de la cohorte"
              icon={UsersRound}
              value={data.cohortUsers}
            />
          )}
        </dl>
      </div>
    </div>
  );
}
