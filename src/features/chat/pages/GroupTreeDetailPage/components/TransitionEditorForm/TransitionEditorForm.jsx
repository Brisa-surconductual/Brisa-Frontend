import { Save, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import {
  OPERADOR_CONDICION,
  OPERADOR_CONDICION_ETIQUETA,
} from '../../../../types/operadorCondicion.js';
import {
  TIPO_DATO_VALIDACION,
  TIPO_DATO_VALIDACION_ETIQUETA,
} from '../../../../types/tipoDatoValidacion.js';
import {
  MODO_REGLA,
  opcionesFormatoTexto,
} from '../../../../services/transicionesAdmin.js';

const OPCIONES_OPERADOR = Object.values(OPERADOR_CONDICION).map((operador) => ({
  value: operador,
  label: OPERADOR_CONDICION_ETIQUETA[operador],
}));

const OPCIONES_TIPO_DATO = Object.values(TIPO_DATO_VALIDACION).map((tipo) => ({
  value: tipo,
  label: TIPO_DATO_VALIDACION_ETIQUETA[tipo],
}));

const OPCIONES_FORMATO_TEXTO = opcionesFormatoTexto();

const OPCIONES_MODO_REGLA = [
  { value: MODO_REGLA.EXISTENTE, label: 'Usar una regla ya creada' },
  { value: MODO_REGLA.NUEVA, label: 'Definir una regla nueva' },
];

/*
 * Crear o editar una transición de un flujo en borrador (RF-25, PR4). El
 * nodo origen no se puede editar una vez creada la transición. La condición
 * cambia de forma (IGUALDAD/RANGO/CATEGORIA) según el operador elegido, y
 * la regla de validación es exactamente una de dos: reutilizar una regla
 * existente del catálogo, o definir una nueva embebida en la solicitud.
 */
export function TransitionEditorForm({
  mode,
  values,
  errors,
  saving,
  saveError,
  nodos,
  reglasValidacion,
  onChange,
  onSubmit,
  onCancel,
}) {
  const title = mode === 'edit' ? 'Editar transición' : 'Nueva transición';

  return (
    <section
      aria-labelledby="editor-transicion-titulo"
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--brand-200)] bg-[var(--surface-card)] p-[var(--space-5)]"
    >
      <h2
        id="editor-transicion-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        {title}
      </h2>

      <form
        noValidate
        className="flex flex-col gap-[var(--space-4)]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
          <SelectField
            id="transicion-origen"
            label="Nodo de origen"
            required
            disabled={saving || mode === 'edit'}
            value={values.idNodoOrigen}
            options={nodos}
            error={errors.idNodoOrigen}
            hint={
              mode === 'edit'
                ? 'El origen no se puede cambiar una vez creada.'
                : undefined
            }
            onChange={(event) => onChange('idNodoOrigen', event.target.value)}
          />

          <SelectField
            id="transicion-destino"
            label="Nodo de destino"
            required
            disabled={saving}
            value={values.idNodoDestino}
            options={nodos}
            error={errors.idNodoDestino}
            onChange={(event) => onChange('idNodoDestino', event.target.value)}
          />
        </div>

        <SelectField
          id="transicion-operador"
          label="Operador de la condición"
          required
          disabled={saving}
          value={values.operadorCondicion}
          options={OPCIONES_OPERADOR}
          error={errors.operadorCondicion}
          onChange={(event) =>
            onChange('operadorCondicion', event.target.value)
          }
        />

        {values.operadorCondicion === OPERADOR_CONDICION.IGUALDAD && (
          <TextField
            id="transicion-valor-igualdad"
            label="Valor esperado de la respuesta"
            required
            disabled={saving}
            value={values.valorIgualdad}
            error={errors.valorIgualdad}
            hint="Se compara tal cual contra la respuesta del estudiante."
            onChange={(event) => onChange('valorIgualdad', event.target.value)}
          />
        )}

        {values.operadorCondicion === OPERADOR_CONDICION.RANGO && (
          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
            <TextField
              id="transicion-valor-min"
              label="Mínimo"
              type="number"
              inputMode="decimal"
              disabled={saving}
              value={values.valorMin}
              error={errors.valorMin}
              hint="Opcional si hay máximo."
              onChange={(event) => onChange('valorMin', event.target.value)}
            />
            <TextField
              id="transicion-valor-max"
              label="Máximo"
              type="number"
              inputMode="decimal"
              disabled={saving}
              value={values.valorMax}
              error={errors.valorMax}
              hint="Opcional si hay mínimo."
              onChange={(event) => onChange('valorMax', event.target.value)}
            />
          </div>
        )}

        {values.operadorCondicion === OPERADOR_CONDICION.CATEGORIA && (
          <TextField
            id="transicion-valor-categoria"
            label="Valores que activan esta transición"
            required
            disabled={saving}
            value={values.valorCategoria}
            error={errors.valorCategoria}
            hint="Separados por comas, por ejemplo: SI, TAL_VEZ"
            onChange={(event) => onChange('valorCategoria', event.target.value)}
          />
        )}

        <TextField
          id="transicion-orden-evaluacion"
          label="Orden de evaluación"
          type="number"
          inputMode="numeric"
          min={1}
          required
          className="md:max-w-[220px]"
          disabled={saving}
          value={values.ordenEvaluacion}
          error={errors.ordenEvaluacion}
          hint="Entre las transiciones del mismo origen, se evalúan en este orden."
          onChange={(event) => onChange('ordenEvaluacion', event.target.value)}
        />

        <SelectField
          id="transicion-modo-regla"
          label="Regla de validación de la respuesta"
          disabled={saving}
          value={values.modoRegla}
          options={OPCIONES_MODO_REGLA}
          onChange={(event) => onChange('modoRegla', event.target.value)}
        />

        {values.modoRegla === MODO_REGLA.EXISTENTE ? (
          <SelectField
            id="transicion-regla-existente"
            label="Regla existente"
            required
            disabled={saving}
            value={values.idReglaValidacion}
            options={reglasValidacion}
            error={errors.idReglaValidacion}
            onChange={(event) =>
              onChange('idReglaValidacion', event.target.value)
            }
          />
        ) : (
          <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)]">
            <SelectField
              id="transicion-regla-tipo-dato"
              label="Tipo de dato"
              required
              disabled={saving}
              value={values.reglaTipoDato}
              options={OPCIONES_TIPO_DATO}
              onChange={(event) =>
                onChange('reglaTipoDato', event.target.value)
              }
            />

            {values.reglaTipoDato === TIPO_DATO_VALIDACION.NUMERICO && (
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                <TextField
                  id="transicion-regla-valor-min"
                  label="Mínimo"
                  type="number"
                  inputMode="decimal"
                  disabled={saving}
                  value={values.reglaValorMin}
                  error={errors.reglaValorMin}
                  onChange={(event) =>
                    onChange('reglaValorMin', event.target.value)
                  }
                />
                <TextField
                  id="transicion-regla-valor-max"
                  label="Máximo"
                  type="number"
                  inputMode="decimal"
                  disabled={saving}
                  value={values.reglaValorMax}
                  error={errors.reglaValorMax}
                  onChange={(event) =>
                    onChange('reglaValorMax', event.target.value)
                  }
                />
              </div>
            )}

            {values.reglaTipoDato === TIPO_DATO_VALIDACION.TEXTO && (
              <SelectField
                id="transicion-regla-formato"
                label="Formato permitido"
                disabled={saving}
                value={values.reglaFormatoPreset}
                options={OPCIONES_FORMATO_TEXTO}
                hint="Elige qué puede escribir el estudiante en esta respuesta."
                onChange={(event) =>
                  onChange('reglaFormatoPreset', event.target.value)
                }
              />
            )}

            {values.reglaTipoDato === TIPO_DATO_VALIDACION.SELECCION && (
              <TextField
                id="transicion-regla-opciones"
                label="Opciones permitidas"
                required
                disabled={saving}
                value={values.reglaValoresPermitidos}
                error={errors.reglaValoresPermitidos}
                hint="Separadas por comas."
                onChange={(event) =>
                  onChange('reglaValoresPermitidos', event.target.value)
                }
              />
            )}

            <TextField
              id="transicion-regla-mensaje"
              label="Mensaje de error"
              required
              disabled={saving}
              value={values.reglaMensajeError}
              error={errors.reglaMensajeError}
              hint="Se muestra al estudiante cuando su respuesta no cumple la regla."
              onChange={(event) =>
                onChange('reglaMensajeError', event.target.value)
              }
            />

            <Checkbox
              id="transicion-regla-obligatorio"
              checked={values.reglaObligatorio}
              disabled={saving}
              onChange={(event) =>
                onChange('reglaObligatorio', event.target.checked)
              }
            >
              La respuesta es obligatoria
            </Checkbox>
          </div>
        )}

        {saveError && (
          <ChatAdminNotice
            tone="danger"
            role="alert"
            title="No se pudo guardar la transición"
          >
            {saveError}
          </ChatAdminNotice>
        )}

        <div className="flex flex-col gap-[var(--space-3)] sm:flex-row">
          <Button
            type="submit"
            size="large"
            loading={saving}
            loadingText="Guardando..."
          >
            <Save size={20} strokeWidth={1.8} aria-hidden="true" />
            Guardar transición
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="large"
            disabled={saving}
            onClick={onCancel}
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
