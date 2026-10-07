import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

import { useAssociateContentForm } from './hooks/useAssociateContentForm.js';
import { useScheduledContentAvailabilityForm } from './hooks/useScheduledContentAvailabilityForm.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { canModifyScheduledContent } from '@/features/cronograma/utils/scheduledContentPermissions.js';

import { obtenerCatalogoContenidos } from '@/features/cronograma/api/contenido/obtenerCatalogoContenidos.jsx';
import { obtenerContenidosUnidadTemporal } from '@/features/cronograma/api/contenidoUnidadTemporal/obtenerContenidosUnidadTemporal.jsx';
import { getUnitTemporalByShulde } from '@/features/cronograma/api/unidadTemporal/getUnitTemporalByShulde.jsx';

import {
  PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL,
  SCHEDULED_CONTENT_STATUS,
} from '@/features/cronograma/types/contentTypes.js';

import { asociarContenidoUnidadTemporal } from '@/features/cronograma/api/contenidoUnidadTemporal/asociarContenidoUnidadTemporal.jsx';
import { actualizarDisponibilidadContenido } from '@/features/cronograma/api/contenidoUnidadTemporal/actualizarDisponibilidadContenido.jsx';
import { eliminarAsociacionContenidoUnidadTemporal } from '@/features/cronograma/api/contenidoUnidadTemporal/eliminarAsociacionContenidoUnidadTemporal.jsx';

const EMPTY_CONTENT_CATALOG = Object.freeze([]);
const EMPTY_TEMPORAL_UNITS = Object.freeze([]);
const EMPTY_SCHEDULED_CONTENT = Object.freeze([]);
function getTemporalUnitStatus(unit) {
  const now = Date.now();
  const start = new Date(unit.fechaInicio).getTime();
  const end = new Date(unit.fechaFin).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'POR_DEFINIR';
  }

  if (now < start) {
    return 'BLOQUEADA';
  }

  if (now > end) {
    return 'COMPLETADA';
  }

  return 'ACTIVA';
}

function getScheduledContentStatus(
  availableFrom,
  availableUntil,
) {
  const now = Date.now();
  const start = new Date(availableFrom).getTime();
  const end = new Date(availableUntil).getTime();

  if (now < start) {
    return SCHEDULED_CONTENT_STATUS.PROGRAMADO;
  }

  if (now < end) {
    return SCHEDULED_CONTENT_STATUS.ACTIVO;
  }

  return SCHEDULED_CONTENT_STATUS.COMPLETADO;
}

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  const pad = (number) =>
    String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function mapScheduledContents(contents, unitId) {
  return contents.map((content) => ({
    id: content.idContenidoCronograma,
    contentId: content.idContenido,
    temporalUnitId: unitId,
    order: content.ordenContenido,
    availableFrom: toDateTimeLocal(
      content.fechaInicioDisponibilidad,
    ),
    availableUntil: toDateTimeLocal(
      content.fechaFinDisponibilidad,
    ),
    status: getScheduledContentStatus(
      content.fechaInicioDisponibilidad,
      content.fechaFinDisponibilidad,
    ),
  }));
}
const CONTENT_LIST_HEADING_ID =
  'associate-content-list-heading';
export function AssociateContentPage() {
  const navigate = useNavigate();
  const { scheduleId, unitId } = useParams();

  const { role, logout } = useAuth();

  const [contentCatalog, setContentCatalog] = useState(
    EMPTY_CONTENT_CATALOG,
  );

  const [temporalUnits, setTemporalUnits] = useState(
    EMPTY_TEMPORAL_UNITS,
  );

  const [scheduledContent, setScheduledContent] = useState(
    EMPTY_SCHEDULED_CONTENT,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editingAssociation, setEditingAssociation] = useState(null);
  const [pendingDeleteAssociation, setPendingDeleteAssociation] = useState(null);

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setLoadError('');

      try {
        const [
          catalogData,
          unitsResponse,
          scheduledResponse,
        ] = await Promise.all([
          obtenerCatalogoContenidos(),
          getUnitTemporalByShulde(scheduleId),
          obtenerContenidosUnidadTemporal({
            scheduleId,
            temporalUnitId: unitId,
          }),
        ]);

        const unitsData = Array.isArray(unitsResponse)
          ? unitsResponse
          : unitsResponse?.data ?? [];

        setContentCatalog(
          catalogData.map((content) => ({
            id: content.idContenido,
            title: content.nombre,
            type: content.tipoContenido,
            associated: content.asociado,
            associationId:
              content.idAsociasionUnidadTemporalContenido,
          })),
        );

        setTemporalUnits(
          unitsData.map((temporalUnit) => ({
            id: temporalUnit.idUnidadTemporal,
            name: temporalUnit.nombreUnidadTemporal,
            order: temporalUnit.orden,
            startDate: temporalUnit.fechaInicio,
            endDate: temporalUnit.fechaFin,
            status: getTemporalUnitStatus(temporalUnit),
          })),
        );

        setScheduledContent(
          mapScheduledContents(
            scheduledResponse.contenidos ?? [],
            unitId,
          ),
        );
      } catch {
        setLoadError(
          'No pudimos cargar la información de la unidad y sus contenidos.',
        );
      } finally {
        setLoading(false);
      }
    }

    if (scheduleId && unitId) {
      loadPageData();
    }
  }, [scheduleId, unitId]);

  const unit = temporalUnits.find(
    (temporalUnit) => temporalUnit.id === unitId,
  );

  async function refreshAssociationData() {
    const [catalogData, scheduledResponse] =
      await Promise.all([
        obtenerCatalogoContenidos(),
        obtenerContenidosUnidadTemporal({
          scheduleId,
          temporalUnitId: unitId,
        }),
      ]);

    setContentCatalog(
      catalogData.map((content) => ({
        id: content.idContenido,
        title: content.nombre,
        type: content.tipoContenido,
        associated: content.asociado,
        associationId:
          content.idAsociasionUnidadTemporalContenido,
      })),
    );

    setScheduledContent(
      mapScheduledContents(
        scheduledResponse.contenidos ?? [],
        unitId,
      ),
    );
  }

  async function handleValidAvailabilitySubmit({
    associationId,
    availableFrom,
    availableUntil,
  }) {
    setLoadError('');

    try {
      await actualizarDisponibilidadContenido({
        associationId,
        availableFrom: new Date(availableFrom).toISOString(),
        availableUntil: new Date(
          availableUntil,
        ).toISOString(),
      });

      await refreshAssociationData();

      resetAvailabilityForm();
      setEditingAssociation(null);
    } catch {
      setLoadError(
        'No pudimos actualizar la disponibilidad del contenido.',
      );
    }
  }

  async function handleValidSubmit({
    contentId,
    temporalUnitId,
    availableFrom,
    availableUntil,
  }) {
    setLoadError('');

    try {
      await asociarContenidoUnidadTemporal({
        contentId,
        temporalUnitId,
        availableFrom: new Date(availableFrom).toISOString(),
        availableUntil: new Date(
          availableUntil,
        ).toISOString(),
      });

      await refreshAssociationData();
      clearAssociationForm();
    } catch {
      setLoadError(
        'No pudimos asociar el contenido a la unidad temporal.',
      );
    }
  }
  const {
    form,
    errors,
    handleChange,
    handleSubmit,
    clearAssociationForm,
  } = useAssociateContentForm({
    initialTemporalUnitId: unitId,
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

  async function handleConfirmDeleteAssociation() {
    if (!pendingDeleteAssociation?.id) {
      return;
    }

    setLoadError('');

    try {
      await eliminarAsociacionContenidoUnidadTemporal(
        pendingDeleteAssociation.id,
      );

      await refreshAssociationData();
    } catch {
      setLoadError(
        'No pudimos desvincular el contenido de la unidad temporal.',
      );
    } finally {
      setPendingDeleteAssociation(null);
    }
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
      !item.associated &&
      !takenContentIds.has(item.id),
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

  const contentHint = selectedContent
  ? `Tipo: ${
      PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[
        selectedContent.type
      ] ?? selectedContent.type
    }`
  : contentOptions.length === 0
    ? 'No hay contenidos disponibles en el catálogo.'
    : '';

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

          {loadError && (
            <div
              className="mt-[var(--space-5)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[13px] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {loadError}
            </div>
          )}

          {loading ? (
            <p
              className="mt-[var(--space-6)] text-[13px] text-[var(--text-muted)]"
              role="status"
            >
              Cargando contenidos de la unidad...
            </p>
          ) : unit ? (
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
                                canModifyScheduledContent(item.status) ? (
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
