import { Filter, Tags } from 'lucide-react';

import { SelectField } from '@/shared/components/ui/SelectField/index.js';

import {
  describirEntradasPermitidas,
  describirEtiquetas,
  etiquetaTipoValor,
  opcionesVariable,
  variablePorCodigo,
} from '../../services/taxonomiaVariables.js';

// Superficie "glass" del design system (tokens --glass-*): translúcida,
// con desenfoque y borde suave; el texto conserva AA sobre --glass-bg-strong.
export const GLASS_PANEL =
  'rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]';

/*
 * RF-30B: el administrador indica qué variable de la taxonomía captura el
 * nodo (opcional, una por nodo). Al elegirla se muestran los tipos de
 * respuesta que admite —el selector de tipo queda filtrado— y las
 * etiquetas con que se clasificará la respuesta del estudiante.
 */
export function TaxonomyVariablePicker({
  variables = [],
  value,
  error,
  disabled,
  onChange,
}) {
  const variable = variablePorCodigo(variables, value);
  const reglas = describirEtiquetas(variable);

  return (
    <section
      aria-labelledby="nodo-variable-titulo"
      className={`${GLASS_PANEL} flex flex-col gap-[var(--space-3)] p-[var(--space-4)]`}
    >
      <div className="flex items-center gap-[var(--space-2)]">
        <span className="inline-flex size-[32px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--glass-brand-bg)] text-[var(--glass-brand-text)]">
          <Tags size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h3
          id="nodo-variable-titulo"
          className="m-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]"
        >
          Variable taxonómica
        </h3>
      </div>

      <SelectField
        id="nodo-variable"
        label="Variable que captura este nodo"
        disabled={disabled}
        value={value}
        options={opcionesVariable(variables, value)}
        placeholder="Este nodo no captura ninguna variable"
        hint="Opcional. La respuesta del estudiante se etiquetará con la taxonomía de psicología para el seguimiento."
        error={error}
        onChange={(event) => onChange(event.target.value)}
      />

      {variable && (
        <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] bg-[var(--glass-bg-strong)] p-[var(--space-3)]">
          {variable.descripcion && (
            <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
              {variable.descripcion}
            </p>
          )}

          <p className="m-0 flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-primary)]">
            <Filter size={16} strokeWidth={1.8} aria-hidden="true" />
            Tipo de respuesta permitido: {describirEntradasPermitidas(variable)}
          </p>

          <div>
            <p className="m-0 mb-[var(--space-2)] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)]">
              Etiquetas ({etiquetaTipoValor(variable.tipo_valor)})
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-[var(--space-2)] p-0">
              {reglas.map((regla) => (
                <li
                  key={regla.clave}
                  className="rounded-[var(--radius-full)] border border-[var(--glass-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--text-primary)]"
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
          </div>
        </div>
      )}
    </section>
  );
}
