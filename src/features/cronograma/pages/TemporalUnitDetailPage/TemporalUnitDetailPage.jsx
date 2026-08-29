import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { TemporalUnitActions } from '@/features/cronograma/components/TemporalUnitActions/index.js';

import { TEMPORAL_UNIT_STATUS_LABEL } from '@/features/cronograma/types/scheduleTypes.js';

import { formatScheduleDateRange } from '@/features/cronograma/utils/scheduleDateUtils.js';

import { TemporalUnitForm } from '@/features/cronograma/components/TemporalUnitForm/index.js';

import { useEditTemporalUnitForm } from './hooks/useEditTemporalUnitForm.js';

import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

export function TemporalUnitDetailPage() {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const location = useLocation();

  const unit = location.state?.unit ?? null;

  const [isEditing, setIsEditing] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleValidEditSubmit() {
    setIsEditing(false);
  }

  const { form, errors, handleChange, handleSubmit, resetForm } =
    useEditTemporalUnitForm({
      unit,
      onValidSubmit: handleValidEditSubmit,
    });

  const { role, logout } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
  }

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleEdit() {
    resetForm();
    setIsEditing(true);
  }

  function handleCancelEdit() {
    resetForm();
    setIsEditing(false);
  }

  function handleDelete() {
    setIsDeleteDialogOpen(true);
  }

  function handleCancelDelete() {
    setIsDeleteDialogOpen(false);
  }

  function handleConfirmDelete() {
    setIsDeleteDialogOpen(false);
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
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

          {unit ? (
            isEditing ? (
              <div className="mt-[var(--space-6)]">
                <TemporalUnitForm
                  form={form}
                  errors={errors}
                  title="Editar unidad temporal"
                  description="Actualiza los datos de la unidad temporal seleccionada."
                  submitText="Guardar cambios"
                  submitLoadingText="Guardando cambios..."
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                />
              </div>
            ) : (
              <section className="mt-[var(--space-6)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
                <div className="flex flex-col gap-[var(--space-5)]">
                  <div>
                    <div className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="m-0 text-[20px] font-bold text-[var(--text-primary)]">
                        {unit.name}
                      </h2>

                      <span className="w-fit rounded-[var(--radius-full)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-1)] text-[11px] font-bold text-[var(--text-secondary)]">
                        {TEMPORAL_UNIT_STATUS_LABEL[unit.status] ?? unit.status}
                      </span>
                    </div>

                    <dl className="mt-[var(--space-5)] grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                      <div>
                        <dt className="text-[12px] font-semibold text-[var(--text-muted)]">
                          Fechas
                        </dt>

                        <dd className="mt-[var(--space-1)] ml-0 text-[14px] text-[var(--text-primary)]">
                          {formatScheduleDateRange(
                            unit.startDate,
                            unit.endDate,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[12px] font-semibold text-[var(--text-muted)]">
                          Actividades
                        </dt>

                        <dd className="mt-[var(--space-1)] ml-0 text-[14px] text-[var(--text-primary)]">
                          {unit.activityCount ?? 0}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <TemporalUnitActions
                    status={unit.status}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </section>
            )
          ) : (
            <p className="mt-[var(--space-2)] mb-0 text-[13px] text-[var(--text-muted)]">
              Unidad seleccionada: {unitId}
            </p>
          )}
        </div>
      </main>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Eliminar unidad temporal"
        description={
          unit
            ? `¿Estás seguro de eliminar "${unit.name}"? Esta acción requiere confirmación.`
            : '¿Estás seguro de eliminar esta unidad temporal?'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
