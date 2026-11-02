import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CircleCheck,
  Info,
  Layers,
  ListOrdered,
  Lock,
  SearchX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { PanelNotice } from '@/features/cronograma/components/PanelNotice/index.js';
import { ScheduleFilters } from '@/features/cronograma/components/ScheduleFilters/index.js';
import { ScheduleStatusBadge } from '@/features/cronograma/components/ScheduleStatusBadge/index.js';
import { TemporalUnitList } from '@/features/cronograma/components/TemporalUnitList/index.js';

import { ScheduleActivationAction } from '../../components/ScheduleActivationAction/ScheduleActivationAction.jsx';
import { getUnitTemporalByShulde } from '../../api/unidadTemporal/getUnitTemporalByShulde';
import { listSchedule } from '../../api/cronograma/listSchedule.jsx';

export function SchedulePanelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idSchedule } = useParams();

  const [schedule, setSchedule] = useState(location.state?.schedule);
  const [activationMessage, setActivationMessage] = useState('');

  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchUnits = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const schedules = await listSchedule();
        const current = schedules.find(
          (item) => item.idCronograma === idSchedule,
        );
        if (!current) throw new Error('No se encontró el cronograma.');
        if (!mounted) return;
        setSchedule(current);
        const response = await getUnitTemporalByShulde(idSchedule);
        const dataArray = Array.isArray(response)
          ? response
          : response?.data || [];

        const formattedUnits = dataArray.map((unit) => {
          const now = new Date();
          const start = new Date(unit.fechaInicio);
          const end = new Date(unit.fechaFin);

          let currentStatus = 'POR_DEFINIR';
          if (now >= start && now <= end) currentStatus = 'ACTIVA';
          else if (now > end) currentStatus = 'COMPLETADA';
          else if (now < start) currentStatus = 'BLOQUEADA';

          return {
            ...unit,
            status: currentStatus,
          };
        });

        formattedUnits.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        if (mounted) setUnits(formattedUnits);
      } catch (error) {
        if (mounted)
          setLoadError(
            error.response?.status === 401
              ? 'Tu sesión terminó. Inicia sesión nuevamente.'
              : 'No pudimos actualizar el cronograma. Recarga la página para reintentar.',
          );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchUnits();
    return () => {
      mounted = false;
    };
  }, [idSchedule]);

  const filteredUnits = units.filter((unit) => {
    if (statusFilter && unit.status !== statusFilter) {
      return false;
    }

    if (dateFilter) {
      if (!unit.fechaInicio || !unit.fechaFin) return false;

      const startString = unit.fechaInicio.split('T')[0];
      const endString = unit.fechaFin.split('T')[0];

      if (dateFilter < startString || dateFilter > endString) {
        return false;
      }
    }

    return true;
  });

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCreateTemporalUnit() {
    if (isLoading || loadError || schedule?.estado !== 'INACTIVO') return;
    navigate(
      `/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/crear-unidad`,
      {
        state: { schedule },
      },
    );
  }

  function handleViewUnitDetails(unit) {
    const unitId = unit.idUnidadTemporal || unit.id;

    navigate(
      `/app/administrativo/cronograma/${encodeURIComponent(idSchedule)}/unidades/${encodeURIComponent(unitId)}`,
      {
        state: { unit },
      },
    );
  }

  const isActiveSchedule = schedule?.estado === 'ACTIVO';
  const canCreateUnit =
    !isLoading && !loadError && schedule?.estado === 'INACTIVO';

  const backLink = (
    <button
      type="button"
      className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-0 bg-transparent px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] hover:underline"
      onClick={handleBack}
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      Volver a todos los cronogramas
    </button>
  );

  if (!schedule) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
        {backLink}

        {isLoading ? (
          <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
            <p role="status" className="sr-only">
              Consultando cronograma...
            </p>
            <div
              className="h-[168px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              aria-hidden="true"
            />
          </div>
        ) : (
          <PanelNotice
            tone={loadError ? 'danger' : 'neutral'}
            icon={loadError ? AlertTriangle : SearchX}
            title={loadError ? 'No pudimos cargar el cronograma' : 'Cronograma no encontrado'}
            role={loadError ? 'alert' : 'status'}
            action={
              <Button variant="secondary" size="small" onClick={handleBack}>
                Volver a cronogramas
              </Button>
            }
          >
            {loadError || 'No se encontró la información del cronograma.'}
          </PanelNotice>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      {backLink}

      <header className="flex flex-col gap-[var(--space-5)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] md:p-[var(--space-6)] lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-[var(--space-3)]">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
            Panel del cronograma
          </p>

          <div className="flex flex-wrap items-center gap-[var(--space-3)]">
            <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
              {schedule.nombreCronograma}
            </h1>

            <ScheduleStatusBadge status={schedule.estado} />
          </div>

          <dl className="m-0 flex flex-wrap gap-x-[var(--space-6)] gap-y-[var(--space-2)] text-[length:var(--font-size-sm)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <Layers size={16} strokeWidth={1.8} aria-hidden="true" />
                Tipo
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)]">
                {schedule.esBase ? 'Cronograma base' : 'Cronograma estándar'}
              </dd>
            </div>

            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" />
                Creación
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                {schedule.fechaCreacion
                  ? schedule.fechaCreacion.split('T')[0]
                  : 'N/A'}
              </dd>
            </div>

            <div className="flex items-center gap-[var(--space-2)]">
              <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
                <ListOrdered size={16} strokeWidth={1.8} aria-hidden="true" />
                Unidades
              </dt>
              <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
                {isLoading ? '…' : units.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-[var(--space-3)] sm:flex-row lg:shrink-0">
          <ScheduleActivationAction
            schedule={schedule}
            disabled={
              isLoading || Boolean(loadError) || units.length === 0
            }
            onActivated={(activeSchedule) => {
              setSchedule(activeSchedule);
              setActivationMessage(
                'Cronograma activado. Los nuevos estudiantes recibirán el cronograma base activo.',
              );
              navigate(location.pathname, {
                replace: true,
                state: { ...location.state, schedule: activeSchedule },
              });
            }}
          />

          <Button
            // Sin unidades, crear la primera es la acción que corresponde.
            variant={units.length === 0 ? 'primary' : 'secondary'}
            disabled={!canCreateUnit}
            onClick={handleCreateTemporalUnit}
          >
            <CalendarPlus size={18} strokeWidth={2} aria-hidden="true" />
            Crear unidad temporal
          </Button>
        </div>
      </header>

      {loadError ? (
        <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
          {loadError}
        </PanelNotice>
      ) : isActiveSchedule ? (
        <PanelNotice
          tone="neutral"
          icon={Lock}
          title="Cronograma activo · solo lectura"
          role="status"
        >
          Este cronograma está activo y su estructura es de solo lectura. Para
          cambiar la planificación, configura un nuevo cronograma inactivo
          antes de activarlo.
        </PanelNotice>
      ) : (
        <PanelNotice tone="info" icon={Info} role="status">
          Añade las unidades temporales y asocia sus contenidos antes de activar
          el cronograma. Sin unidades no se puede activar.
        </PanelNotice>
      )}

      {activationMessage && (
        <PanelNotice tone="success" icon={CircleCheck} role="status">
          {activationMessage}
        </PanelNotice>
      )}

      <ScheduleFilters
        status={statusFilter}
        date={dateFilter}
        resultCount={filteredUnits.length}
        totalCount={units.length}
        onStatusChange={setStatusFilter}
        onDateChange={setDateFilter}
      />

      <section
        aria-labelledby="unidades-titulo"
        aria-busy={isLoading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div>
          <h2
            id="unidades-titulo"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Unidades temporales
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            Gestiona los bloques de tiempo asignados a este cronograma.
          </p>
        </div>

        {isLoading ? (
          <>
            <p role="status" className="sr-only">
              Cargando unidades temporales...
            </p>
            <div className="flex flex-col gap-[var(--space-3)]" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-[88px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                />
              ))}
            </div>
          </>
        ) : filteredUnits.length > 0 ? (
          <TemporalUnitList
            units={filteredUnits}
            onViewDetails={handleViewUnitDetails}
          />
        ) : (
          <PanelNotice
            tone="neutral"
            icon={units.length > 0 ? SearchX : CalendarRange}
            title="No hay resultados"
            role="status"
          >
            {units.length > 0
              ? 'Ninguna unidad temporal coincide con los filtros aplicados.'
              : 'Aún no hay unidades temporales creadas.'}
          </PanelNotice>
        )}
      </section>
    </div>
  );
}
