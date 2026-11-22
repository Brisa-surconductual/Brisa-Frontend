import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import {
  categoriaVacia,
  rangoVacio,
} from '../../../../services/taxonomiaVariables.js';
import { TIPO_ENTRADA_ETIQUETA } from '../../../../types/tipoEntrada.js';
import {
  ENTRADAS_POR_TIPO_VALOR,
  TIPO_VALOR_VARIABLE,
  TIPO_VALOR_VARIABLE_ETIQUETA,
} from '../../../../types/tipoValorVariable.js';

const OPCIONES_TIPO_VALOR = Object.values(TIPO_VALOR_VARIABLE).map((tipo) => ({
  value: tipo,
  label: TIPO_VALOR_VARIABLE_ETIQUETA[tipo],
}));

function ErrorTexto({ id, children }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
    >
      {children}
    </p>
  );
}

const GRUPO =
  'flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] p-[var(--space-4)]';

/*
 * RF-30B: alta de una variable de la taxonomía. La definición no se edita
 * después (solo se habilita o deshabilita), por eso se revisa antes de
 * crear. Los subcampos cambian según el tipo de valor. Vive dentro de
 * ChatAdminModal, que aporta título y botones.
 */
export function CreateVariableForm({
  formId,
  values,
  errors,
  saving,
  saveError,
  onChange,
  onSubmit,
}) {
  const admitidas = ENTRADAS_POR_TIPO_VALOR[values.tipoValor];
  const cambiarLista = (campo, indice, parcial) =>
    onChange(
      campo,
      values[campo].map((item, i) =>
        i === indice ? { ...item, ...parcial } : item,
      ),
    );

  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-[var(--space-4)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <ChatAdminNotice tone="info" title="La definición no se edita">
        Después de crearla solo podrás habilitarla o deshabilitarla. Para
        corregirla, crea otra variable y deshabilita la anterior.
      </ChatAdminNotice>

      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
        <TextField
          id="variable-codigo"
          label="Código"
          required
          disabled={saving}
          value={values.codigo}
          error={errors.codigo}
          hint="Ej.: HORAS_SUENO. Mayúsculas y guion bajo."
          onChange={(event) => onChange('codigo', event.target.value)}
        />
        <TextField
          id="variable-nombre"
          label="Nombre"
          required
          disabled={saving}
          value={values.nombre}
          error={errors.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
        />
      </div>

      <TextField
        id="variable-descripcion"
        label="Descripción (opcional)"
        disabled={saving}
        value={values.descripcion}
        onChange={(event) => onChange('descripcion', event.target.value)}
      />

      <SelectField
        id="variable-tipo-valor"
        label="Tipo de valor"
        required
        disabled={saving}
        value={values.tipoValor}
        options={OPCIONES_TIPO_VALOR}
        onChange={(event) => onChange('tipoValor', event.target.value)}
      />

      <fieldset className={GRUPO}>
        <legend className="px-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
          Tipos de respuesta del nodo que admite
        </legend>
        {admitidas.map((tipo) => (
          <Checkbox
            key={tipo}
            id={`variable-entrada-${tipo}`}
            checked={values.tiposEntrada.includes(tipo)}
            disabled={saving}
            onChange={(event) =>
              onChange(
                'tiposEntrada',
                event.target.checked
                  ? [...values.tiposEntrada, tipo]
                  : values.tiposEntrada.filter((t) => t !== tipo),
              )
            }
          >
            {TIPO_ENTRADA_ETIQUETA[tipo]}
          </Checkbox>
        ))}
        <ErrorTexto id="variable-entradas-error">
          {errors.tiposEntrada}
        </ErrorTexto>
      </fieldset>

      {values.tipoValor === TIPO_VALOR_VARIABLE.ENTERO && (
        <fieldset className={GRUPO}>
          <legend className="px-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
            Rangos y etiquetas
          </legend>
          {values.rangos.map((rango, indice) => (
            <div
              key={indice}
              className="grid grid-cols-1 gap-[var(--space-2)] sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-start"
            >
              <TextField
                id={`variable-rango-min-${indice}`}
                label="Desde"
                type="number"
                inputMode="numeric"
                disabled={saving}
                value={rango.min}
                onChange={(e) =>
                  cambiarLista('rangos', indice, { min: e.target.value })
                }
              />
              <TextField
                id={`variable-rango-max-${indice}`}
                label="Hasta"
                type="number"
                inputMode="numeric"
                disabled={saving}
                value={rango.max}
                hint="Vacío = sin tope"
                onChange={(e) =>
                  cambiarLista('rangos', indice, { max: e.target.value })
                }
              />
              <TextField
                id={`variable-rango-etiqueta-${indice}`}
                label="Etiqueta"
                disabled={saving}
                value={rango.etiqueta}
                onChange={(e) =>
                  cambiarLista('rangos', indice, { etiqueta: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="small"
                className="sm:mt-[26px]"
                disabled={saving || values.rangos.length === 1}
                aria-label={`Quitar rango ${indice + 1}`}
                onClick={() =>
                  onChange(
                    'rangos',
                    values.rangos.filter((_, i) => i !== indice),
                  )
                }
              >
                <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            className="self-start"
            disabled={saving}
            onClick={() => onChange('rangos', [...values.rangos, rangoVacio()])}
          >
            <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
            Agregar rango
          </Button>
          <ErrorTexto id="variable-rangos-error">{errors.rangos}</ErrorTexto>
        </fieldset>
      )}

      {values.tipoValor === TIPO_VALOR_VARIABLE.CATEGORIA && (
        <fieldset className={GRUPO}>
          <legend className="px-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
            Categorías
          </legend>
          {values.categorias.map((categoria, indice) => (
            <div
              key={indice}
              className="grid grid-cols-1 gap-[var(--space-2)] sm:grid-cols-[1fr_1fr_auto] sm:items-start"
            >
              <TextField
                id={`variable-categoria-${indice}`}
                label={`Valor ${indice + 1}`}
                disabled={saving}
                value={categoria.valor}
                onChange={(e) =>
                  cambiarLista('categorias', indice, { valor: e.target.value })
                }
              />
              <TextField
                id={`variable-categoria-etiqueta-${indice}`}
                label="Etiqueta (opcional)"
                disabled={saving}
                value={categoria.etiqueta}
                hint="Vacía = el mismo valor"
                onChange={(e) =>
                  cambiarLista('categorias', indice, {
                    etiqueta: e.target.value,
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="small"
                className="sm:mt-[26px]"
                disabled={saving}
                aria-label={`Quitar categoría ${indice + 1}`}
                onClick={() =>
                  onChange(
                    'categorias',
                    values.categorias.filter((_, i) => i !== indice),
                  )
                }
              >
                <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            className="self-start"
            disabled={saving}
            onClick={() =>
              onChange('categorias', [...values.categorias, categoriaVacia()])
            }
          >
            <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
            Agregar categoría
          </Button>
          <ErrorTexto id="variable-categorias-error">
            {errors.categorias}
          </ErrorTexto>
        </fieldset>
      )}

      {values.tipoValor === TIPO_VALOR_VARIABLE.BOOLEANO && (
        <fieldset className={GRUPO}>
          <legend className="px-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
            Etiquetas
          </legend>
          <div className="grid grid-cols-1 gap-[var(--space-3)] md:grid-cols-2">
            <TextField
              id="variable-etiqueta-si"
              label="Etiqueta para Sí"
              disabled={saving}
              value={values.etiquetaSi}
              onChange={(e) => onChange('etiquetaSi', e.target.value)}
            />
            <TextField
              id="variable-etiqueta-no"
              label="Etiqueta para No"
              disabled={saving}
              value={values.etiquetaNo}
              onChange={(e) => onChange('etiquetaNo', e.target.value)}
            />
          </div>
          <ErrorTexto id="variable-booleano-error">
            {errors.etiquetasBooleano}
          </ErrorTexto>
        </fieldset>
      )}

      {saveError && (
        <ChatAdminNotice
          tone="danger"
          role="alert"
          title="No se pudo crear la variable"
        >
          {saveError}
        </ChatAdminNotice>
      )}
    </form>
  );
}
