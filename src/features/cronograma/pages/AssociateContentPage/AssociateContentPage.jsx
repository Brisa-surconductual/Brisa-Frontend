import { useNavigate, useParams } from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { AssociateContentForm } from '@/features/cronograma/components/AssociateContentForm/index.js';
import { ScheduledContentAvailabilityForm } from '@/features/cronograma/components/ScheduledContentAvailabilityForm/index.js';
import { ContentRow } from '@/features/cronograma/components/ContentRow/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

import { CONTENT_TYPE_LABEL } from '@/features/cronograma/types/contentTypes.js';

import { useAssociateContentForm } from './hooks/useAssociateContentForm.js';
import { useScheduledContentAvailabilityForm } from './hooks/useScheduledContentAvailabilityForm.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { canModifyScheduledContent } from '@/features/cronograma/utils/scheduledContentPermissions.js';
import { canModifyTemporalUnit } from '@/features/cronograma/utils/temporalUnitPermissions.js';

const EMPTY_CONTENT_CATALOG = Object.freeze([]);
const EMPTY_TEMPORAL_UNITS = Object.freeze([]);
const EMPTY_SCHEDULED_CONTENT = Object.freeze([]);
const CONTENT_LIST_HEADING_ID = 'associate-content-list-heading';
export function AssociateContentPage({
  contentCatalog = EMPTY_CONTENT_CATALOG,
  temporalUnits = EMPTY_TEMPORAL_UNITS,
  scheduledContent = EMPTY_SCHEDULED_CONTENT,
  onAssociateContent,
  onUpdateScheduledContentAvailability,
  onDeleteScheduledContentAssociation,
} = {}) {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const { role, logout } = useAuth();

  const [editingAssociation, setEditingAssociation] = useState(null);
  const [pendingDeleteAssociation, setPendingDeleteAssociation] = useState(null);

  const unit = temporalUnits.find(
    (temporalUnit) => temporalUnit.id === unitId,
  );

  function handleValidAvailabilitySubmit({
    associationId,
    availableFrom,
    availableUntil,
  }) {
    onUpdateScheduledContentAvailability?.({
      associationId,
      availableFrom,
      availableUntil,
    });
  }

  function handleValidSubmit({
    contentId,
    temporalUnitId,
    order,
  }) {
    const content = contentCatalog.find(
      (item) => item.id === contentId,
    );

    const targetUnit = temporalUnits.find(
      (temporalUnit) =>
        temporalUnit.id === temporalUnitId,
    );

    if (!content || !targetUnit) {
      return;
    }

    onAssociateContent?.({
      contentId,
      temporalUnitId,
      order,
    });
  }
  const {
    form,
    errors,
    handleChange,
    handleSubmit,
  } = useAssociateContentForm({
    initialTemporalUnitId: unit ? unit.id : '',
    scheduledContent,
    onValidSubmit: handleValidSubmit,
  });

  const {
    form: availabilityForm,
    errors: availabilityErrors,
    handleChange: handleAvailabilityChange,
    handleSubmit: handleAvailabilitySubmit,
    loadAvailability,
    resetForm: resetAvailabilityForm,
  } = useScheduledContentAvailabilityForm({
    onValidSubmit: handleValidAvailabilitySubmit,
  });

  function handleEditAvailability(association) {
    if (!association?.id) {
      return;
    }

    loadAvailability({
      associationId: association.id,
      availableFrom: association.availableFrom ?? '',
      availableUntil: association.availableUntil ?? '',
    });

    setEditingAssociation(association);
  }

  function handleCancelAvailabilityEdit() {
    resetAvailabilityForm();
    setEditingAssociation(null);
  }

  function handleRequestDeleteAssociation(association) {
    if (!association?.id) {
      return;
    }

    setPendingDeleteAssociation(association);
  }

  function handleCancelDeleteAssociation() {
    setPendingDeleteAssociation(null);
  }

  function handleConfirmDeleteAssociation() {
    if (!pendingDeleteAssociation?.id) {
      return;
    }

    onDeleteScheduledContentAssociation?.({
      associationId: pendingDeleteAssociation.id,
    });

    setPendingDeleteAssociation(null);
  }

  const selectedUnit = temporalUnits.find(
    (temporalUnit) => temporalUnit.id === form.temporalUnitId,
  );

  // filter() ya devuelve un array nuevo, así que sort() no muta el estado.
  const unitContent = scheduledContent
    .filter((item) => item.temporalUnitId === form.temporalUnitId)
    .sort((first, second) => first.order - second.order);

  const takenContentIds = new Set(
    scheduledContent.map((item) => item.contentId),
  );

  // Solo las actividades libres. Mostrar también las ya asociadas para
  // provocar el HTTP 409 es otra tarea de HU-CR-02 / RF-10, y le bastará con
  // cambiar este filtro.
  const availableContent = contentCatalog.filter(
    (item) =>
      item.assignedTemporalUnitId === null && !takenContentIds.has(item.id),
  );

  const contentOptions = availableContent.map((item) => ({
    value: item.id,
    label: item.title,
  }));

  const temporalUnitOptions = temporalUnits.map((temporalUnit) => ({
    value: temporalUnit.id,
    label: `${temporalUnit.name} · ${temporalUnit.theme}`,
  }));

  const selectedContent = contentCatalog.find(
    (item) => item.id === form.contentId,
  );

  // Sin renumeración automática el orden puede tener huecos (1, 5), así que
  // se listan los ocupados en vez de prometer un único "siguiente".
  let orderHint = '';

  if (unitContent.length > 0) {
    const takenOrders = unitContent.map((item) => item.order);

    orderHint = `Órdenes ocupados: ${takenOrders.join(', ')}. Siguiente al final: ${Math.max(...takenOrders) + 1}.`;
  } else if (form.temporalUnitId) {
    orderHint = 'Esta unidad aún no tiene actividades: empieza en 1.';
  }

  let contentHint = '';

  if (selectedContent) {
    contentHint = `Tipo: ${CONTENT_TYPE_LABEL[selectedContent.type] ?? 'Por definir'}`;
  } else if (contentOptions.length === 0) {
    contentHint = 'No hay actividades disponibles en el catálogo.';
  }

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

  function handleCancel() {
    navigate('/app/administrativo/cronograma');
  }

  function handleFormChange(event) {
    // El mensaje de éxito nombra una actividad y una unidad concretas: deja de
    // describir el formulario en cuanto se toca cualquiera de los campos.

    handleChange(event);
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
            Asociar contenido a esta unidad
          </h1>

          {unit ? (
            <>
              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Selecciona una actividad del catálogo y la unidad temporal en la
                que quedará programada.
              </p>

              <div className="mt-[var(--space-6)]">
                <AssociateContentForm
                  form={form}
                  errors={errors}
                  contentOptions={contentOptions}
                  contentHint={contentHint}
                  temporalUnitOptions={temporalUnitOptions}
                  orderHint={orderHint}
                  onChange={handleFormChange}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </div>
              {editingAssociation && (
                <div className="mt-[var(--space-6)]">
                  <ScheduledContentAvailabilityForm
                    form={availabilityForm}
                    errors={availabilityErrors}
                    contentTitle={editingAssociation.contentTitle ?? ''}
                    temporalUnitName={editingAssociation.temporalUnitName ?? ''}
                    temporalUnitRange={editingAssociation.temporalUnitRange ?? ''}
                    onChange={handleAvailabilityChange}
                    onSubmit={handleAvailabilitySubmit}
                    onCancel={handleCancelAvailabilityEdit}
                  />
                </div>
              )}

              <section
                className="mt-[var(--space-6)]"
                aria-labelledby={CONTENT_LIST_HEADING_ID}
              >
                <h2
                  className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
                  id={CONTENT_LIST_HEADING_ID}
                >
                  Actividades por día
                </h2>

                <p className="mt-[var(--space-1)] mb-0 text-[13px] text-[var(--text-muted)]">
                  {selectedUnit
                    ? `Contenido programado en ${selectedUnit.name}.`
                    : 'Selecciona una unidad temporal para ver su contenido.'}
                </p>

                <div className="mt-[var(--space-4)]">
                  {unitContent.length > 0 ? (
                    <ul className="m-0 grid list-none gap-[var(--space-2)] p-0">
                      {unitContent.map((item) => {
                        const content = contentCatalog.find(
                          (catalogItem) => catalogItem.id === item.contentId,
                        );

                        return (
                          <li key={item.id}>
                            <ContentRow
                              order={item.order}
                              title={content?.title ?? item.contentId}
                              contentType={content?.type}
                              status={item.status}
                              actions={
                                canModifyScheduledContent(item.status) &&
                                canModifyTemporalUnit(selectedUnit?.status) ? (
                                  <>
                                    <Button
                                      size="small"
                                      variant="secondary"
                                      onClick={() =>
                                        handleEditAvailability({
                                          ...item,
                                          contentTitle: content?.title ?? item.contentId,
                                          temporalUnitName: selectedUnit?.name ?? '',
                                        })
                                      }
                                    >
                                      Editar disponibilidad
                                    </Button>

                                    <Button
                                      size="small"
                                      variant="danger"
                                      onClick={() =>
                                        handleRequestDeleteAssociation({
                                          ...item,
                                          contentTitle: content?.title ?? item.contentId,
                                          temporalUnitName: selectedUnit?.name ?? '',
                                        })
                                      }
                                    >
                                      Desvincular
                                    </Button>
                                  </>
                                ) : null
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyScheduleState
                      title="Sin actividades asociadas"
                      description="Esta unidad temporal todavía no tiene contenido programado."
                    />
                  )}
                </div>
              </section>
              <ConfirmationDialog
                open={Boolean(pendingDeleteAssociation)}
                title="Desvincular contenido"
                description={
                  pendingDeleteAssociation
                    ? `¿Deseas desvincular "${pendingDeleteAssociation.contentTitle}" de ${pendingDeleteAssociation.temporalUnitName}? Esta acción quitará el contenido de la unidad temporal.`
                    : ''
                }
                confirmText="Desvincular"
                cancelText="Cancelar"
                onConfirm={handleConfirmDeleteAssociation}
                onCancel={handleCancelDeleteAssociation}
              />
            </>
          ) : (
            <div className="mt-[var(--space-6)]">
              <EmptyScheduleState
                title="Unidad temporal no encontrada"
                description={`No existe una unidad temporal con el identificador "${unitId}".`}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
