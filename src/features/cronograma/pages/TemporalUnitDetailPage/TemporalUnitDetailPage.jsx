import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarRange,
  CircleCheck,
  FileStack,
  ListOrdered,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';
import {updateUnitTemporal} from '../../api/unidadTemporal/updateUnitTemporal';
import {deleteUnitTemporal} from '../../api/unidadTemporal/delelteUnitTemporal';

import { BackButton } from '@/features/cronograma/components/BackButton/index.js';
import { ContentRow } from '@/features/cronograma/components/ContentRow/index.js';
import { EditTemporalUnitDialog } from '@/features/cronograma/components/EditTemporalUnitDialog/index.js';
import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { SchedulePageHeader } from '@/features/cronograma/components/SchedulePageHeader/index.js';
import { TemporalUnitStatusBadge } from '@/features/cronograma/components/TemporalUnitStatusBadge/index.js';
import { obtenerContenidosUnidadTemporal } from '@/features/cronograma/api/contenidoUnidadTemporal/obtenerContenidosUnidadTemporal.jsx';
import { SCHEDULED_CONTENT_STATUS } from '@/features/cronograma/types/contentTypes.js';

const PAGE_CLASS =
  'mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]';
const CARD_CLASS =
  'rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]';

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

function formatAvailability(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}
export function TemporalUnitDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scheduleId, unitId } = useParams();
  const [formError, setFormError] = useState('');
  const [unit, setUnit] = useState(location.state?.unit ?? null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(''); 
  const [successMessage, setSuccessMessage] = useState('');
  const [editForm, setEditForm] = useState({
    nombre: unit?.nombreUnidadTemporal || '',
    fecha_inicio: unit?.fechaInicio?.split('T')[0] || '',
    fecha_fin: unit?.fechaFin?.split('T')[0] || ''
  });

  const [associatedContents, setAssociatedContents] = useState([]);
  const [isLoadingContents, setIsLoadingContents] = useState(true);
  const [contentsError, setContentsError] = useState('');

  useEffect(() => {
    async function loadAssociatedContents() {
      setIsLoadingContents(true);
      setContentsError('');

      try {
        const data = await obtenerContenidosUnidadTemporal({
          scheduleId,
          temporalUnitId: unitId,
        });

        setAssociatedContents(data.contenidos ?? []);
      } catch {
        setContentsError(
          'No fue posible cargar los contenidos asociados a esta unidad.',
        );
      } finally {
        setIsLoadingContents(false);
      }
    }

    if (scheduleId && unitId) {
      void  loadAssociatedContents();
    }
  }, [scheduleId, unitId]);

  function handleBack() {
    navigate(-1);
  }

  function handleAssociateContent() {
    navigate(
      `/app/administrativo/cronograma/${encodeURIComponent(scheduleId)}/unidades/${encodeURIComponent(unitId)}/contenido`,
      {
        state: { unit },
      },
    );
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    const payload = {
      idUnidadTemporal: unit.idUnidadTemporal,
    };

    if (editForm.nombre) payload.nombre = editForm.nombre;
    if (editForm.fecha_inicio) payload.fecha_inicio = editForm.fecha_inicio;
    if (editForm.fecha_fin) payload.fecha_fin = editForm.fecha_fin;

    try {
      await updateUnitTemporal(payload);
      
      setUnit({
        ...unit,
        nombreUnidadTemporal: editForm.nombre || unit.nombreUnidadTemporal,
        fechaInicio: editForm.fecha_inicio || unit.fechaInicio,
        fechaFin: editForm.fecha_fin || unit.fechaFin
      });
      
      setIsEditModalOpen(false);
    } catch (error) {
      const mensajeDelBack = error.response?.data?.message || 'Ocurrió un error inesperado';
      setFormError(Array.isArray(mensajeDelBack) ? mensajeDelBack[0] : mensajeDelBack);
      // Solo el estado HTTP: el error de axios incluye el
      // payload y la cabecera CSRF.
      console.error(
        'Error al actualizar la unidad. Estado HTTP:',
        error?.response?.status ?? 'sin respuesta',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteClick() {
    setIsDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    setActionError(''); // Limpiamos errores previos
    
    try {
      await deleteUnitTemporal(unit.idUnidadTemporal);
      
      setIsDeleteDialogOpen(false);
      setSuccessMessage('Unidad Temporal eliminada correctamente.');
      setTimeout(() => {
        handleBack();
      }, 1500);
    } catch (error) {
      // Solo el estado HTTP: el error de axios incluye el
      // payload y la cabecera CSRF.
      console.error(
        'Error al eliminar la unidad. Estado HTTP:',
        error?.response?.status ?? 'sin respuesta',
      );
      
      const data = error.response?.data;
      let mensajeDelBack = 'No fue posible eliminar la unidad temporal.';
      
      if (data?.message) {
        mensajeDelBack = Array.isArray(data.message) ? data.message[0] : data.message;
      } else if (error.message) {
        mensajeDelBack = error.message;
      }
      
      setIsDeleteDialogOpen(false);
      
      setActionError(mensajeDelBack);
    }
  }

  // Tras eliminar, la unidad ya no existe: sus acciones quedan
  // deshabilitadas mientras se regresa al panel.
  const isDeleted = Boolean(successMessage);

  if (!unit) {
    return (
      <div className={PAGE_CLASS}>
        <PanelNotice
          tone="neutral"
          icon={SearchX}
          title="Unidad no disponible"
          role="status"
          action={
            <Button
              variant="secondary"
              onClick={() => navigate('/app/administrativo/cronograma')}
            >
              Volver a cronogramas
            </Button>
          }
        >
          Unidad no encontrada o datos perdidos.
        </PanelNotice>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASS}>
      <BackButton onClick={handleBack}>
        Volver al panel del cronograma
      </BackButton>

      <div className={CARD_CLASS}>
        <SchedulePageHeader
          eyebrow="Unidad temporal"
          title={unit.nombreUnidadTemporal}
          badge={
            unit.status ? (
              <TemporalUnitStatusBadge status={unit.status} />
            ) : null
          }
          actions={
            <>
              <Button
                variant="secondary"
                disabled={isDeleted}
                onClick={() => { setFormError(''); setIsEditModalOpen(true); }}
              >
                <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
                Editar
              </Button>
              <Button
                variant="secondary"
                disabled={isDeleted}
                onClick={handleDeleteClick}
              >
                {/* Peso visual secundario; el color y el ícono indican riesgo. */}
                <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--danger-text)]">
                  <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
                  Eliminar
                </span>
              </Button>
            </>
          }
        >
          <dl className="m-0 mt-[var(--space-2)] flex flex-wrap gap-x-[var(--space-6)] gap-y-[var(--space-2)] text-[length:var(--font-size-sm)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <ListOrdered size={16} strokeWidth={1.8} aria-hidden="true" />
                Orden
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                {unit.orden ?? '-'}
              </dd>
            </div>

            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <CalendarRange size={16} strokeWidth={1.8} aria-hidden="true" />
                Vigencia
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                {unit.fechaInicio?.split('T')[0]} al {unit.fechaFin?.split('T')[0]}
              </dd>
            </div>

            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <FileStack size={16} strokeWidth={1.8} aria-hidden="true" />
                Contenidos
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                {isLoadingContents
                  ? '…'
                  : contentsError
                    ? '—'
                    : associatedContents.length}
              </dd>
            </div>
          </dl>
        </SchedulePageHeader>
      </div>

      {actionError && (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo eliminar la unidad"
          role="alert"
        >
          {actionError}
        </PanelNotice>
      )}

      {successMessage && (
        <PanelNotice tone="success" icon={CircleCheck} role="status">
          {successMessage} Regresando al panel...
        </PanelNotice>
      )}

      <section
        aria-labelledby="contenidos-asociados-titulo"
        aria-busy={isLoadingContents}
        className={`${CARD_CLASS} flex flex-col gap-[var(--space-5)]`}
      >
        <div className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="contenidos-asociados-titulo"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Contenidos asociados
            </h2>
            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Contenidos programados en esta unidad y su rango de
              disponibilidad.
            </p>
          </div>

          <Button
            onClick={handleAssociateContent}
            disabled={isDeleted}
            className="shrink-0"
          >
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Asociar contenido
          </Button>
        </div>

        {contentsError ? (
          <PanelNotice
            tone="danger"
            icon={AlertTriangle}
            title="Contenidos no disponibles"
            role="alert"
          >
            {contentsError}
          </PanelNotice>
        ) : isLoadingContents ? (
          <>
            <p role="status" className="sr-only">
              Cargando contenidos asociados...
            </p>
            <div className="flex flex-col gap-[var(--space-2)]" aria-hidden="true">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="h-[64px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-hover)] motion-reduce:animate-none"
                />
              ))}
            </div>
          </>
        ) : associatedContents.length > 0 ? (
          <ul className="m-0 grid list-none gap-[var(--space-2)] p-0">
            {associatedContents.map((content) => (
              <li key={content.idContenidoCronograma}>
                <ContentRow
                  order={content.ordenContenido}
                  title={content.nombreContenido}
                  contentType={content.tipo}
                  status={getScheduledContentStatus(
                    content.fechaInicioDisponibilidad,
                    content.fechaFinDisponibilidad,
                  )}
                  subtitle={`${formatAvailability(
                    content.fechaInicioDisponibilidad,
                  )} al ${formatAvailability(
                    content.fechaFinDisponibilidad,
                  )}`}
                />
              </li>
            ))}
          </ul>
        ) : (
          <PanelNotice
            tone="neutral"
            icon={FileStack}
            title="Sin contenidos asociados"
            role="status"
          >
            Aún no hay contenidos asociados a esta unidad temporal.
          </PanelNotice>
        )}
      </section>

      <EditTemporalUnitDialog
        open={isEditModalOpen}
        form={editForm}
        error={formError}
        isSubmitting={isSubmitting}
        onChange={handleEditChange}
        onSubmit={handleUpdateSubmit}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Eliminar unidad temporal"
        description={`¿Estás seguro de eliminar la unidad "${unit.nombreUnidadTemporal}"? Esta acción requiere confirmación y podría afectar los contenidos asociados.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
