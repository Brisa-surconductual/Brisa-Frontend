import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import {
  AdministrativeHeader,
} from '@/shared/components/navigation/AdministrativeHeader/index.js';
import {
  AdministrativeTabBar,
} from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

export function TemporalUnitDetailPage() {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const { role, logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (
      tabId ===
      ADMINISTRATIVE_TAB.CRONOGRAMA
    ) {
      navigate(
        '/app/administrativo/cronograma',
      );
      return;
    }

    if (
      tabId ===
      ADMINISTRATIVE_TAB.DASHBOARD
    ) {
      navigate('/app/administrativo');
      return;
    }

    navigate(
      `/app/administrativo?tab=${encodeURIComponent(
        tabId,
      )}`,
    );
  }

  function handleBack() {
    navigate(
      '/app/administrativo/cronograma',
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={
          role ?? 'ADMINISTRATIVO'
        }
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={
          ADMINISTRATIVE_TAB.CRONOGRAMA
        }
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto w-full max-w-[1200px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al cronograma
          </button>

          <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
            Administración
          </p>

          <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
            Detalle de unidad temporal
          </h1>

          <p className="mt-[var(--space-2)] mb-0 text-[13px] text-[var(--text-muted)]">
            Unidad seleccionada: {unitId}
          </p>
        </div>
      </main>
    </div>
  );
}