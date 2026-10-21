import { useNavigate } from 'react-router-dom';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { PersonalizedTreesList } from '../../components/PersonalizedTreesList/index.js';

export function PersonalizedTreesPage({
  trees = null,
  isLoading = false,
  error = null,
}) {
  const navigate = useNavigate();

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CHAT) {
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    if (
      tabId === ADMINISTRATIVE_TAB.POBLACION ||
      tabId === ADMINISTRATIVE_TAB.AJUSTES
    ) {
      navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader roleLabel="Administrativo" />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CHAT}
        onTabChange={handleTabChange}
      />

      <ChatSectionTabs />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--brand-600)]">
            Módulo 03 · Chat terapéutico
          </p>

          <h1 className="mt-[var(--space-2)] mb-0 text-2xl font-extrabold text-[var(--text-primary)] md:text-3xl">
            Administración de árboles conversacionales
          </h1>

          <p className="mt-[var(--space-3)] max-w-[680px] text-sm leading-relaxed text-[var(--text-secondary)]">
            Consulta los árboles personalizados según las combinaciones de
            dependencia y craving.
          </p>
        </header>

        <PersonalizedTreesList
          trees={trees}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}
