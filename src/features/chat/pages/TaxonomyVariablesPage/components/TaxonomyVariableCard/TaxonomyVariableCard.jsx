import { CircleCheck, CircleOff, Lock, Power } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { GLASS_PANEL } from '../../../../components/TaxonomyVariablePicker/index.js';
import {
  describirEntradasPermitidas,
  describirEtiquetas,
  etiquetaTipoValor,
} from '../../../../services/taxonomiaVariables.js';

/*
 * Tarjeta glass de una variable de la taxonomía. El estado se comunica con
 * ícono y texto, no solo con color. Una variable en uso por un flujo
 * publicado no ofrece "Deshabilitar" (el backend también lo impide).
 */
export function TaxonomyVariableCard({ variable, cambiando, onToggle }) {
  const habilitada = variable.habilitada !== false;
  const bloqueada = habilitada && variable.en_uso_publicado === true;

  return (
    <li
      className={`${GLASS_PANEL} flex flex-col gap-[var(--space-3)] p-[var(--space-5)] ${
        habilitada ? '' : 'opacity-80'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
          <h3 className="m-0 text-[length:var(--font-size-base)] font-bold text-[var(--text-primary)]">
            {variable.nombre}
          </h3>
          <code className="font-[var(--font-mono)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            {variable.codigo}
          </code>
        </div>

        <span
          className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${
            habilitada
              ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
              : 'border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)]'
          }`}
        >
          {habilitada ? (
            <CircleCheck size={13} strokeWidth={2} aria-hidden="true" />
          ) : (
            <CircleOff size={13} strokeWidth={2} aria-hidden="true" />
          )}
          {habilitada ? 'Habilitada' : 'Deshabilitada'}
        </span>
      </div>

      {variable.descripcion && (
        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          {variable.descripcion}
        </p>
      )}

      <dl className="m-0 grid grid-cols-1 gap-[var(--space-2)] text-[length:var(--font-size-xs)] sm:grid-cols-2">
        <div>
          <dt className="font-bold text-[var(--text-secondary)]">
            Tipo de valor
          </dt>
          <dd className="m-0 text-[var(--text-primary)]">
            {etiquetaTipoValor(variable.tipo_valor)}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-[var(--text-secondary)]">
            Respuestas permitidas
          </dt>
          <dd className="m-0 text-[var(--text-primary)]">
            {describirEntradasPermitidas(variable)}
          </dd>
        </div>
      </dl>

      <ul
        aria-label={`Etiquetas de ${variable.nombre}`}
        className="m-0 flex list-none flex-wrap gap-[var(--space-2)] p-0"
      >
        {describirEtiquetas(variable).map((regla) => (
          <li
            key={regla.clave}
            className="rounded-[var(--radius-full)] border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--text-primary)]"
          >
            <span className="font-semibold">{regla.rango}</span>
            {regla.etiqueta !== regla.rango && (
              <span className="font-[var(--font-mono)] text-[var(--text-secondary)]">
                {' '}
                → {regla.etiqueta}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        {bloqueada ? (
          <p className="m-0 inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
            <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
            En uso por un flujo publicado: no se puede deshabilitar.
          </p>
        ) : (
          <Button
            type="button"
            variant={habilitada ? 'secondary' : 'primary'}
            size="small"
            disabled={Boolean(cambiando)}
            onClick={() => onToggle(variable)}
          >
            <Power size={16} strokeWidth={1.8} aria-hidden="true" />
            {habilitada ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        )}
      </div>
    </li>
  );
}
