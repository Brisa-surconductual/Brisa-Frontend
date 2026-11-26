import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarRange,
  CalendarClock,
  FileStack,
  Link2Off,
  ListOrdered,
  Lock,
  PackageOpen,
  PencilLine,
  SearchX,
} from 'lucide-react';

import { AssociateContentForm } from '@/features/cronograma/components/AssociateContentForm/index.js';
import { ScheduledContentAvailabilityForm } from '@/features/cronograma/components/ScheduledContentAvailabilityForm/index.js';
import { ContentRow } from '@/features/cronograma/components/ContentRow/index.js';
import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { TemporalUnitStatusBadge } from '@/features/cronograma/components/TemporalUnitStatusBadge/index.js';

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
import { associationErrorMessage } from '../../utils/associationErrorMessage.js';

const PAGE_CLASS =
  'mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]';
const CARD_CLASS =
  'rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]';
const CHIP_CLASS =
  'inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold';

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

function getScheduledContentStatus(availableFrom, availableUntil) {
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

  const pad = (number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mapScheduledContents(contents, unitId) {
  return contents.map((content) => ({
    id: content.idContenidoCronograma,
    contentId: content.idContenido,
    temporalUnitId: unitId,
    order: content.ordenContenido,
    availableFrom: toDateTimeLocal(content.fechaInicioDisponibilidad),
    availableUntil: toDateTimeLocal(content.fechaFinDisponibilidad),
    status: getScheduledContentStatus(
      content.fechaInicioDisponibilidad,
      content.fechaFinDisponibilidad,
    ),
  }));
}
const CONTENT_LIST_HEADING_ID = 'associate-content-list-heading';
export function AssociateContentPage() {
  const navigate = useNavigate();
  const { scheduleId, unitId } = useParams();

  const [contentCatalog, setContentCatalog] = useState(EMPTY_CONTENT_CATALOG);

  const [temporalUnits, setTemporalUnits] = useState(EMPTY_TEMPORAL_UNITS);

  const [scheduledContent, setScheduledContent] = useState(
    EMPTY_SCHEDULED_CONTENT,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [associationSuccess, setAssociationSuccess] = useState('');
  const [scheduleEditable, setScheduleEditable] = useState(false);

  const [editingAssociation, setEditingAssociation] = useState(null);
  const [pendingDeleteAssociation, setPendingDeleteAssociation] =
    useState(null);

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setLoadError('');

      try {
        const [catalogData, unitsResponse, scheduledResponse] =
          await Promise.all([
            obtenerCatalogoContenidos(),
            getUnitTemporalByShulde(scheduleId),
            obtenerContenidosUnidadTemporal({
              scheduleId,
              temporalUnitId: unitId,
            }),
          ]);

        const unitsData = Array.isArray(unitsResponse)
          ? unitsResponse
          : (unitsResponse?.data ?? []);

        setContentCatalog(
          catalogData.map((content) => ({
            id: content.idContenido,
            title: content.nombre,
            type: content.tipoContenido,
            associated: content.asociado,
            associationId: content.idAsociasionUnidadTemporalContenido,
            ready: content.listoParaProgramar === true,
          })),
        );
        setScheduleEditable(scheduledResponse.estadoCronograma === 'INACTIVO');

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
          mapScheduledContents(scheduledResponse.contenidos ?? [], unitId),
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
      void loadPageData();
    }
  }, [scheduleId, unitId]);

  const unit = temporalUnits.find((temporalUnit) => temporalUnit.id === unitId);

  async function refreshAssociationData() {
    const [catalogData, scheduledResponse] = await Promise.all([
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
        associationId: content.idAsociasionUnidadTemporalContenido,
        ready: content.listoParaProgramar === true,
      })),
    );

    setScheduledContent(
      mapScheduledContents(scheduledResponse.contenidos ?? [], unitId),
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
        availableUntil: new Date(availableUntil).toISOString(),
      });

      await refreshAssociationData();

      resetAvailabilityForm();
      setEditingAssociation(null);
    } catch {
      setLoadError('No pudimos actualizar la disponibilidad del contenido.');
    }
  }

  async function handleValidSubmit({
    contentId,
    availableFrom,
    availableUntil,
  }) {
    setLoadError('');
    setAssociationSuccess('');
    if (!scheduleEditable) {
      setLoadError(
        'El cronograma está activo. La programación es de solo lectura.',
      );
      return;
    }

    try {
      await asociarContenidoUnidadTemporal({
        contentId,
        temporalUnitId: unitId,
        availableFrom: new Date(availableFrom).toISOString(),
        availableUntil: new Date(availableUntil).toISOString(),
      });
    } catch (error) {
      setLoadError(associationErrorMessage(error));
      return;
    }
    clearAssociationForm();
    setAssociationSuccess(
      'Contenido asociado correctamente a esta unidad temporal.',
    );
    try {
      await refreshAssociationData();
    } catch {
      setLoadError(
        'La asociación se guardó, pero no pudimos actualizar el listado. Recarga la página antes de volver a asociar contenido.',
      );
    }
  }
  const {
    form,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearAssociationForm,
  } = useAssociateContentForm({
    onValidSubmit: handleValidSubmit,
    unit,
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

  // filter() ya devuelve un array nuevo, así que sort() no muta el estado.
  const unitContent = scheduledContent
    .filter((item) => item.temporalUnitId === unitId)
    .sort((first, second) => first.order - second.order);

  const takenContentIds = new Set(
    scheduledContent.map((item) => item.contentId),
  );

  // Solo los contenidos libres. Mostrar también las ya asociadas para
  // provocar el HTTP 409 es otra tarea de HU-CR-02 / RF-10, y le bastará con
  // cambiar este filtro.
  const availableContent = contentCatalog.filter(
    (item) => item.ready && !item.associated && !takenContentIds.has(item.id),
  );
  const incompleteContent = contentCatalog.filter(
    (item) => !item.associated && !item.ready,
  );
  function completeResources(item) {
    navigate(
      `/app/administrativo/cronograma/contenidos/${encodeURIComponent(item.id)}/recursos`,
      {
        state: {
          creationFlow: true,
          returnToAssociation: { scheduleId, unitId },
        },
      },
    );
  }

  const contentOptions = availableContent.map((item) => ({
    value: item.id,
    label: item.title,
  }));

  const selectedContent = contentCatalog.find(
    (item) => item.id === form.contentId,
  );

  const contentHint = selectedContent
    ? `Tipo: ${
        PSYCHOEDUCATIONAL_CONTENT_TYPE_LABEL[selectedContent.type] ??
        selectedContent.type
      }`
    : contentOptions.length === 0
      ? contentCatalog.length === 0
        ? 'Aún no hay contenidos registrados. Crea un contenido para poder asociarlo a esta unidad.'
        : incompleteContent.length > 0
          ? 'Hay contenidos pendientes de recursos. Complétalos antes de asociarlos.'
          : 'Los contenidos del catálogo ya están vinculados a unidades temporales. Cada contenido solo puede pertenecer a una unidad. Crea un contenido nuevo para continuar.'
      : '';

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCancel() {
    navigate('/app/administrativo/cronograma');
  }

  function handleFormChange(event) {
    setAssociationSuccess('');
    // El mensaje de éxito nombra un contenido y una unidad concretos: deja de
    // describir el formulario en cuanto se toca cualquiera de los campos.

    handleChange(event);
  }

  return (
    <div className={PAGE_CLASS}>
      <BackButton onClick={handleBack}>Volver a cronogramas</BackButton>

      <div className={CARD_CLASS}>
        <SchedulePageHeader
          eyebrow="Programación de contenidos"
          title="Asociar contenido a esta unidad"
          description={
            !loading && unit
              ? 'Selecciona un contenido del catálogo y define su rango de disponibilidad para esta unidad temporal.'
              : undefined
          }
          badge={
            !loading && unit ? (
              scheduleEditable ? (
                <span
                  className={`${CHIP_CLASS} border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]`}
                >
                  <PencilLine size={13} strokeWidth={2} aria-hidden="true" />
                  Programación editable
                </span>
              ) : (
                <span
                  className={`${CHIP_CLASS} border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]`}
                >
                  <Lock size={13} strokeWidth={2} aria-hidden="true" />
                  Solo lectura
                </span>
              )
            ) : null
          }
        >
          {!loading && unit && (
            <dl className="m-0 mt-[var(--space-2)] flex flex-wrap gap-x-[var(--space-6)] gap-y-[var(--space-2)] text-[length:var(--font-size-sm)]">
              <div className="flex min-w-0 items-center gap-[var(--space-2)]">
                <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                  <ListOrdered size={16} strokeWidth={1.8} aria-hidden="true" />
                  Unidad
                </dt>
                <dd className="m-0 min-w-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                  {unit.order != null ? `${unit.order}. ` : ''}
                  {unit.name}
                </dd>
              </div>

              <div className="flex items-center gap-[var(--space-2)]">
                <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                  <CalendarRange size={16} strokeWidth={1.8} aria-hidden="true" />
                  Vigencia
                </dt>
                <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                  {unit.startDate?.split('T')[0]} al{' '}
                  {unit.endDate?.split('T')[0]}
                </dd>
              </div>

              <div className="flex items-center gap-[var(--space-2)]">
                <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                  <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
                  Estado
                </dt>
                <dd className="m-0">
                  <TemporalUnitStatusBadge status={unit.status} />
                </dd>
              </div>
            </dl>
          )}
        </SchedulePageHeader>
      </div>

      {loadError && (
        <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
          {loadError}
        </PanelNotice>
      )}

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando contenidos de la unidad...
          </p>
          <div className="grid gap-[var(--space-6)] xl:grid-cols-2" aria-hidden="true">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="h-[280px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      ) : unit ? (
        <>
          {!scheduleEditable && (
            <PanelNotice
              tone="neutral"
              icon={Lock}
              title="Cronograma activo · solo lectura"
              role="status"
            >
              Este cronograma está activo. Sus contenidos y su programación
              son de solo lectura.
            </PanelNotice>
          )}

          <div
            className={
              scheduleEditable
                ? 'grid items-start gap-[var(--space-6)] xl:grid-cols-2'
                : 'flex flex-col gap-[var(--space-6)]'
            }
          >
            {scheduleEditable && (
              <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
                {incompleteContent.length > 0 && (
                  <section
                    className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)]"
                    aria-label="Contenidos pendientes de recursos"
                  >
                    <div className="flex items-start gap-[var(--space-3)] text-[var(--warning-text)]">
                      <PackageOpen
                        size={20}
                        strokeWidth={1.8}
                        className="mt-[2px] shrink-0"
                        aria-hidden="true"
                      />
                      <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold">
                        Completa los recursos de estos contenidos antes de
                        programarlos:
                      </p>
                    </div>

                    <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
                      {incompleteContent.map((item) => (
                        <li key={item.id}>
                          <Button
                            variant="secondary"
                            fullWidth
                            className="justify-start text-left"
                            onClick={() => completeResources(item)}
                          >
                            Completar recursos de {item.title}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <AssociateContentForm
                  form={form}
                  errors={errors}
                  contentOptions={contentOptions}
                  contentHint={contentHint}
                  isSubmitting={isSubmitting}
                  unit={
                    unit
                      ? {
                          ...unit,
                          startDate: toDateTimeLocal(unit.startDate),
                          endDate: toDateTimeLocal(unit.endDate),
                        }
                      : undefined
                  }
                  successMessage={associationSuccess}
                  onChange={handleFormChange}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  onCreateContent={() =>
                    navigate(
                      '/app/administrativo/cronograma/contenidos/nuevo',
                      {
                        state: {
                          returnToAssociation: { scheduleId, unitId },
                        },
                      },
                    )
                  }
                />
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
              {editingAssociation && (
                <ScheduledContentAvailabilityForm
                  // Una edición por asociación: al cambiar de
                  // contenido, el formulario recibe el foco de nuevo.
                  key={editingAssociation.id}
                  form={availabilityForm}
                  errors={availabilityErrors}
                  contentTitle={editingAssociation.contentTitle ?? ''}
                  temporalUnitName={editingAssociation.temporalUnitName ?? ''}
                  temporalUnitRange={
                    editingAssociation.temporalUnitRange ?? ''
                  }
                  onChange={handleAvailabilityChange}
                  onSubmit={handleAvailabilitySubmit}
                  onCancel={handleCancelAvailabilityEdit}
                />
              )}

              <section
                className={`${CARD_CLASS} flex flex-col gap-[var(--space-4)]`}
                aria-labelledby={CONTENT_LIST_HEADING_ID}
              >
                <div className="flex items-start justify-between gap-[var(--space-3)]">
                  <div className="min-w-0">
                    <h2
                      className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
                      id={CONTENT_LIST_HEADING_ID}
                    >
                      Contenidos asociados
                    </h2>

                    <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] [overflow-wrap:anywhere] text-[var(--text-secondary)]">
                      {`Contenido programado en ${unit.name}.`}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-[var(--radius-full)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)] tabular-nums">
                    {unitContent.length}
                    <span className="sr-only"> contenidos</span>
                  </span>
                </div>

                {unitContent.length > 0 ? (
                  <ul className="m-0 grid list-none gap-[var(--space-2)] p-0">
                    {unitContent.map((item) => {
                      const content = contentCatalog.find(
                        (catalogItem) => catalogItem.id === item.contentId,
                      );
                      const contentTitle = content?.title ?? item.contentId;

                      return (
                        <li key={item.id}>
                          <ContentRow
                            order={item.order}
                            title={contentTitle}
                            contentType={content?.type}
                            status={item.status}
                            actions={
                              scheduleEditable &&
                              canModifyScheduledContent(item.status) ? (
                                <>
                                  <Button
                                    variant="secondary"
                                    onClick={() =>
                                      handleEditAvailability({
                                        ...item,
                                        contentTitle,
                                        temporalUnitName: unit.name,
                                      })
                                    }
                                  >
                                    <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
                                    Editar disponibilidad
                                    <span className="sr-only"> de {contentTitle}</span>
                                  </Button>

                                  <Button
                                    variant="secondary"
                                    onClick={() =>
                                      handleRequestDeleteAssociation({
                                        ...item,
                                        contentTitle,
                                        temporalUnitName: unit.name,
                                      })
                                    }
                                  >
                                    <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--danger-text)]">
                                      <Link2Off size={16} strokeWidth={1.8} aria-hidden="true" />
                                      Desvincular
                                      <span className="sr-only"> {contentTitle}</span>
                                    </span>
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
                  <PanelNotice
                    tone="neutral"
                    icon={FileStack}
                    title="Sin contenidos asociados"
                    role="status"
                  >
                    Esta unidad temporal todavía no tiene contenido programado.
                  </PanelNotice>
                )}
              </section>
            </div>
          </div>

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
        <PanelNotice
          tone="neutral"
          icon={SearchX}
          title="Unidad temporal no encontrada"
          role="status"
          action={
            <Button variant="secondary" onClick={handleBack}>
              Volver a cronogramas
            </Button>
          }
        >
          {`No existe una unidad temporal con el identificador "${unitId}".`}
        </PanelNotice>
      )}
    </div>
  );
}
