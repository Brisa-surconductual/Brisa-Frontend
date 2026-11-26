import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import {
  OPERADOR_CONDICION,
  OPERADOR_CONDICION_ETIQUETA,
} from '../../../../types/operadorCondicion.js';
import { operadorEfectivo } from '../../../../services/transicionesAdmin.js';

function Etiqueta({ titulo, valor }) {
  return (
    // Tinte claro de marca con texto verde oscuro (contraste AA en modo claro
    // y oscuro: la escala --brand-* se invierte en el tema oscuro).
    <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-sm)]">
      <span className="text-[var(--brand-700)]">{titulo}:</span>
      <strong className="text-[var(--brand-800)]">{valor}</strong>
    </span>
  );
}

function ErrorCampo({ children }) {
  return (
    <p
      role="alert"
      className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
    >
      {children}
    </p>
  );
}

/*
 * RF-25: crear o editar una transición (dentro de ChatAdminModal). Cada
 * transición tiene su propia regla, armada según el tipo de respuesta del
 * nodo origen (`config`, de `configuracionReglaTransicion`): el operador, el
 * tipo de dato y el formato se muestran como etiquetas fijas, y el valor
 * esperado siempre se elige de lo que el nodo ya define, nunca se escribe.
 * RF-25: al crear se puede definir a qué nodo va "cualquier otra respuesta"
 * (transición SIEMPRE, siempre la última en evaluarse). El destino nunca
 * ofrece el propio origen.
 */
export function TransitionEditorForm({
  formId,
  mode,
  values,
  errors,
  saving,
  saveError,
  nodosOrigen,
  nodosDestino,
  totalTransicionesOrigen = 0,
  config,
  onChange,
  onSubmit,
}) {
  const operador = config.tipo ? operadorEfectivo(config, values) : '';
  const conRegla =
    !values.esPorDefecto &&
    config.tipo &&
    !config.sinRegla &&
    !config.noSoportado &&
    !config.faltaRango;
  const hintOrden = !values.idNodoOrigen
    ? 'Entre las transiciones del mismo origen, se evalúan en este orden.'
    : totalTransicionesOrigen === 0
      ? 'Sugerido: es la primera transición de este origen.'
      : `Sugerido según las ${totalTransicionesOrigen} transiciones que ya tiene este origen. "Cualquier otra respuesta" siempre se evalúa al final.`;

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
      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
        <SelectField
          id="transicion-origen"
          label="Nodo de origen"
          required
          disabled={saving || mode === 'edit'}
          value={values.idNodoOrigen}
          options={nodosOrigen}
          error={errors.idNodoOrigen}
          hint={
            mode === 'edit'
              ? 'El origen no se puede cambiar una vez creada.'
              : 'Las respuestas de texto libre o fecha no se ofrecen aquí.'
          }
          onChange={(event) => onChange('idNodoOrigen', event.target.value)}
        />

        <SelectField
          id="transicion-destino"
          label="Nodo de destino"
          required
          disabled={saving}
          value={values.idNodoDestino}
          options={nodosDestino}
          error={errors.idNodoDestino}
          onChange={(event) => onChange('idNodoDestino', event.target.value)}
        />
      </div>

      {values.esPorDefecto ? (
        <ChatAdminNotice tone="info" title="Cualquier otra respuesta">
          Esta transición se toma cuando la respuesta no coincide con ninguna
          otra del mismo origen. Siempre se evalúa al final; solo puedes cambiar
          su destino.
        </ChatAdminNotice>
      ) : (
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
          hint={hintOrden}
          onChange={(event) => onChange('ordenEvaluacion', event.target.value)}
        />
      )}

      {!values.esPorDefecto && (
        <fieldset className="m-0 flex flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] p-[var(--space-4)]">
          <legend className="px-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
            Regla de la transición
          </legend>

          {!config.tipo && (
            <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              Elige el nodo de origen para configurar la regla.
            </p>
          )}

          {config.sinRegla && (
            <ChatAdminNotice tone="info" title="Transición automática">
              El nodo de origen no espera respuesta: el estudiante avanza al
              confirmar, sin regla de validación.
            </ChatAdminNotice>
          )}

          {(config.noSoportado || config.faltaRango) && (
            <ChatAdminNotice
              tone="warning"
              title="Este origen no se puede usar"
            >
              {config.noSoportado
                ? 'Las respuestas de texto libre o de fecha u hora no admiten transiciones en esta interfaz.'
                : 'Configura el mínimo y el máximo de la respuesta en el nodo de origen.'}
            </ChatAdminNotice>
          )}

          {conRegla && (
            <>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {config.operadorFijo && (
                  <Etiqueta
                    titulo="Operador"
                    valor={OPERADOR_CONDICION_ETIQUETA[config.operadorFijo]}
                  />
                )}
                <Etiqueta
                  titulo="Tipo de dato"
                  valor={config.etiquetas.tipoDato}
                />
                {config.etiquetas.formato && (
                  <Etiqueta
                    titulo="Formato permitido"
                    valor={config.etiquetas.formato}
                  />
                )}
              </div>

              {!config.operadorFijo && (
                <SelectField
                  id="transicion-operador"
                  label="Operador de la condición"
                  required
                  disabled={saving}
                  value={values.operador}
                  options={config.operadores}
                  error={errors.operador}
                  onChange={(event) => onChange('operador', event.target.value)}
                />
              )}

              {operador === OPERADOR_CONDICION.RANGO && (
                <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                  <TextField
                    id="transicion-rango-min"
                    label="Mínimo esperado"
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    required
                    disabled={saving}
                    value={values.rangoMin}
                    error={errors.rangoMin}
                    hint={`El nodo admite de ${config.min} a ${config.max}.`}
                    onChange={(event) =>
                      onChange('rangoMin', event.target.value)
                    }
                  />
                  <TextField
                    id="transicion-rango-max"
                    label="Máximo esperado"
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    required
                    disabled={saving}
                    value={values.rangoMax}
                    error={errors.rangoMax}
                    onChange={(event) =>
                      onChange('rangoMax', event.target.value)
                    }
                  />
                </div>
              )}

              {operador === OPERADOR_CONDICION.IGUALDAD &&
                (config.tipo === 'MULTISELECCION' ? (
                  <div className="flex flex-col gap-[var(--space-2)]">
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">
                      Valor esperado de la respuesta
                    </span>
                    <p className="m-0 text-[11px] text-[var(--text-muted)]">
                      {config.minSelecciones === config.maxSelecciones
                        ? `Marca ${config.minSelecciones} opciones, como se definió en el nodo.`
                        : `Marca entre ${config.minSelecciones} y ${config.maxSelecciones} opciones, como se definió en el nodo.`}
                    </p>
                    {config.opciones.map((opcion) => (
                      <Checkbox
                        key={opcion.value}
                        id={`transicion-valor-${opcion.value}`}
                        checked={values.valoresMultiples.includes(opcion.value)}
                        disabled={saving}
                        onChange={(event) =>
                          onChange(
                            'valoresMultiples',
                            event.target.checked
                              ? [...values.valoresMultiples, opcion.value]
                              : values.valoresMultiples.filter(
                                  (valor) => valor !== opcion.value,
                                ),
                          )
                        }
                      >
                        {opcion.label}
                      </Checkbox>
                    ))}
                    {errors.valoresMultiples && (
                      <ErrorCampo>{errors.valoresMultiples}</ErrorCampo>
                    )}
                  </div>
                ) : (
                  <SelectField
                    id="transicion-valor-esperado"
                    label="Valor esperado de la respuesta"
                    required
                    disabled={saving}
                    value={values.valorUnico}
                    options={config.opciones ?? config.valores}
                    error={errors.valorUnico}
                    hint="Según lo que se definió al crear la respuesta del nodo."
                    onChange={(event) =>
                      onChange('valorUnico', event.target.value)
                    }
                  />
                ))}

              <TextField
                id="transicion-mensaje-error"
                label="Mensaje de error"
                required
                disabled={saving}
                value={values.mensajeError}
                error={errors.mensajeError}
                hint="Se muestra al estudiante si su respuesta no coincide con ninguna transición."
                onChange={(event) =>
                  onChange('mensajeError', event.target.value)
                }
              />
            </>
          )}
        </fieldset>
      )}

      {mode === 'create' && conRegla && (
        <SelectField
          id="transicion-destino-otro"
          label="Cualquier otra respuesta va a"
          disabled={saving}
          value={values.idNodoDestinoOtro}
          // RF-25: no se ofrece el destino ya elegido para la transición.
          options={nodosDestino.filter(
            (opcion) => opcion.value !== values.idNodoDestino,
          )}
          placeholder="No definir por ahora"
          error={errors.idNodoDestinoOtro}
          hint="Opcional. Si la respuesta no coincide con esta ni con otras transiciones del origen, el estudiante va a este nodo. Puedes agregar más transiciones después para afinar el camino."
          onChange={(event) =>
            onChange('idNodoDestinoOtro', event.target.value)
          }
        />
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
    </form>
  );
}
