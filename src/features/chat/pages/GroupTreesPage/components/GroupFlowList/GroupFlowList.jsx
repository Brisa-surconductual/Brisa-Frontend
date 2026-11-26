import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { FlowStatusBadge } from '../../../../components/FlowStatusBadge/index.js';
import { ESTADO_FLUJO_ETIQUETA } from '../../../../types/estadoFlujo.js';
import { formatDateTime } from '../../../../utils/formatDateTime.js';

function FlowRow({ flujo }) {
  const fecha = formatDateTime(flujo.fechaPublicacion ?? flujo.fechaCreacion);
  const etiquetaFecha = flujo.fechaPublicacion ? 'Publicado' : 'Creado';

  return (
    <li className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <GitBranch
          size={18}
          strokeWidth={1.8}
          className="shrink-0 text-[var(--brand-600)]"
          aria-hidden="true"
        />
        <h3 className="m-0 min-w-0 text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {flujo.nombre}
        </h3>
        <FlowStatusBadge estado={flujo.estado} />
      </div>

      <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
        Versión {flujo.version}
        {fecha && ` · ${etiquetaFecha} el ${fecha}`}
      </p>

      <Link
        to={`/app/administrativo/chat/grupal/${flujo.id}`}
        className="inline-flex min-h-[44px] w-fit items-center gap-[var(--space-1)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-700)] no-underline hover:underline"
      >
        Ver árbol
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </Link>
    </li>
  );
}

export function GroupFlowList({
  status,
  listado,
  loadError,
  estado,
  estadoOptions,
  page,
  onChangeEstado,
  onChangePage,
  onRetry,
}) {
  return (
    <section
      aria-labelledby="flujos-titulo"
      aria-busy={status === 'loading'}
      className="flex flex-col gap-[var(--space-4)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <h2
          id="flujos-titulo"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Flujos grupales
        </h2>

        <SelectField
          id="filtro-estado"
          label="Estado"
          placeholder="Todos"
          className="w-full min-[480px]:w-[200px]"
          value={estado}
          options={estadoOptions.map((value) => ({
            value,
            label: ESTADO_FLUJO_ETIQUETA[value] ?? value,
          }))}
          onChange={(event) => onChangeEstado(event.target.value)}
        />
      </div>

      {status === 'loading' && (
        <p
          role="status"
          className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
        >
          Consultando flujos...
        </p>
      )}

      {status === 'error' && (
        <ChatAdminNotice
          tone="danger"
          icon={AlertTriangle}
          role="alert"
          title="No se pudieron consultar los flujos"
        >
          {loadError}
        </ChatAdminNotice>
      )}

      {status === 'error' && (
        <div>
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw size={18} strokeWidth={1.8} aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}

      {status === 'ready' && listado.items.length === 0 && (
        <ChatAdminNotice tone="neutral" icon={GitBranch}>
          {estado
            ? 'No hay flujos grupales con ese estado.'
            : 'Aún no hay flujos grupales. Crea el primero con el formulario de arriba.'}
        </ChatAdminNotice>
      )}

      {status === 'ready' && listado.items.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
          {listado.items.map((flujo) => (
            <FlowRow key={flujo.id} flujo={flujo} />
          ))}
        </ul>
      )}

      {status === 'ready' && listado.totalPages > 1 && (
        <nav
          aria-label="Paginación de flujos"
          className="flex items-center justify-between gap-[var(--space-3)]"
        >
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onChangePage(page - 1)}
          >
            <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
            Anterior
          </Button>

          <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
            Página {listado.page} de {listado.totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page >= listado.totalPages}
            onClick={() => onChangePage(page + 1)}
          >
            Siguiente
            <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </nav>
      )}
    </section>
  );
}
