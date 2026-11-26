import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { DashboardPanel } from './components/DashboardPanel.jsx';
import { PopulationPanel } from './components/PopulationPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { usePsychologyHomePage } from './hooks/usePsychologyHomePage.js';

/*
 * La navegación entre Dashboard, Población y Ajustes la aporta
 * el layout administrativo (enlaces con ?tab=). Aquí solo se
 * muestra el panel de la sección activa con su título.
 *
 * `cohortDashboard` (opcional): panel de la cohorte activa (RF-140,
 * módulo administrativo). Lo inyecta app/router, porque las features
 * no se importan entre sí; se muestra primero en el Dashboard, por
 * encima de los indicadores del programa y los accesos de gestión.
 */
export function PsychologyHomePage({ cohortDashboard = null }) {
  const {
    email,
    roleLabel,
    activeTabId,
    handleLogout,
  } = usePsychologyHomePage();

  const sectionTitle =
    ADMINISTRATIVE_TABS.find(({ id }) => id === activeTabId)?.label ?? '';

  return (
    <div className="mx-auto w-full max-w-[1200px] p-[var(--space-4)] md:p-[var(--space-7)] lg:px-[var(--space-8)] lg:py-[var(--space-8)]">
      <header className="mb-[var(--space-6)] flex flex-col gap-[var(--space-1)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Panel administrativo
        </p>

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          {sectionTitle}
        </h1>

        {activeTabId === ADMINISTRATIVE_TAB.DASHBOARD && (
          <p className="mt-[var(--space-1)] mb-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            Panorama agregado y anónimo de la cohorte activa y del
            programa. Revisa primero las alertas críticas y accede desde
            aquí a las tareas de gestión.
          </p>
        )}
      </header>

      {activeTabId === ADMINISTRATIVE_TAB.DASHBOARD && (
        <div className="flex flex-col gap-[var(--space-8)]">
          {cohortDashboard}
          {/* Separa el panorama de la cohorte del resumen del programa. */}
          <div
            className={
              cohortDashboard
                ? 'border-t border-[var(--surface-border)] pt-[var(--space-8)]'
                : undefined
            }
          >
            <DashboardPanel />
          </div>
        </div>
      )}

      {activeTabId === ADMINISTRATIVE_TAB.POBLACION && (
        <PopulationPanel />
      )}

      {activeTabId === ADMINISTRATIVE_TAB.AJUSTES && (
        <SettingsPanel
          email={email}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
