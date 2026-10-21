import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';

import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { ProgramEligibilityCard } from '../../components/ProgramEligibilityCard/index.js';
import { ProgramModalityConfirmDialog } from '../../components/ProgramModalityConfirmDialog/index.js';

import { useProgramModalityPage } from './hooks/useProgramModalityPage.js';

import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';

export function ProgramModalityPage({
  eligibility = null,
  isLoading = false,
  error = null,
  onEnableModality,
}) {
  const {
    isConfirmationOpen,
    isProcessing,
    feedback,
    handleOpenConfirmation,
    handleCancelConfirmation,
    handleConfirmModality,
    handleTabChange,
    handleLogout,
  } = useProgramModalityPage({
    eligibility,
    onEnableModality,
  });

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel="Administrativo"
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CHAT}
        onTabChange={handleTabChange}
      />

      <ChatSectionTabs />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <Link
          to="/app/administrativo"
          className="inline-flex w-fit items-center gap-[var(--space-2)] text-sm font-semibold text-[var(--brand-600)] hover:underline"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al panel administrativo
        </Link>

        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--brand-600)]">
            Módulo 03 · Chat terapéutico
          </p>

          <h1 className="mt-[var(--space-2)] mb-0 text-2xl font-extrabold text-[var(--text-primary)] md:text-3xl">
            Administración de modalidad
          </h1>

          <p className="mt-[var(--space-3)] max-w-[680px] text-sm leading-relaxed text-[var(--text-secondary)]">
            Consulta las condiciones del programa antes de habilitar la
            modalidad personalizada para sus participantes activos.
          </p>
        </header>

        <ProgramEligibilityCard
          eligibility={eligibility}
          isLoading={isLoading}
          error={error}
          onEnable={onEnableModality ? handleOpenConfirmation : undefined}
        />

        {feedback && (
          <p
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`rounded-[var(--radius-md)] p-[var(--space-4)] text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
            }`}
          >
            {feedback.message}
          </p>
        )}
      </main>

      <ProgramModalityConfirmDialog
        open={isConfirmationOpen}
        eligibility={eligibility}
        isProcessing={isProcessing}
        onConfirm={handleConfirmModality}
        onCancel={handleCancelConfirmation}
      />
    </div>
  );
}
