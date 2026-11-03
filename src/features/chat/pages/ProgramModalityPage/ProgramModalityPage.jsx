import { AlertTriangle, ArrowLeft, CircleCheck, PlugZap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ChatAdminHeader } from '../../components/ChatAdminHeader/index.js';
import { ChatAdminNotice } from '../../components/ChatAdminNotice/index.js';
import { ChatSectionTabs } from '../../components/ChatSectionTabs/index.js';
import { ProgramEligibilityCard } from '../../components/ProgramEligibilityCard/index.js';
import { ProgramModalityConfirmDialog } from '../../components/ProgramModalityConfirmDialog/index.js';

import { useProgramModalityPage } from './hooks/useProgramModalityPage.js';

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
  } = useProgramModalityPage({
    eligibility,
    onEnableModality,
  });

  // Sin datos ni error: la consulta aún no llega a esta pantalla.
  const isPendingIntegration = !eligibility && !isLoading && !error;

  return (
    <div className="bg-[var(--surface-bg)]">
      <ChatSectionTabs />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        <Link
          to="/app/administrativo"
          className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Volver al panel administrativo
        </Link>

        <ChatAdminHeader
          title="Administración de modalidad"
          description="Consulta las condiciones del programa antes de habilitar la modalidad personalizada para sus participantes activos."
        />

        {isPendingIntegration && (
          <ChatAdminNotice
            tone="warning"
            icon={PlugZap}
            title="Integración pendiente"
          >
            La consulta de elegibilidad y la habilitación de la modalidad aún no
            están conectadas al backend. No se muestran cifras ni se puede
            cambiar la modalidad desde esta pantalla.
          </ChatAdminNotice>
        )}

        <ProgramEligibilityCard
          eligibility={eligibility}
          isLoading={isLoading}
          error={error}
          onEnable={onEnableModality ? handleOpenConfirmation : undefined}
        />

        {feedback && (
          <ChatAdminNotice
            tone={feedback.type === 'success' ? 'success' : 'danger'}
            icon={feedback.type === 'success' ? CircleCheck : AlertTriangle}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </ChatAdminNotice>
        )}
      </div>

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
