import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { ContenidoProgramacion } from '../../../../components/ContenidoProgramacion/index.js';
import { ExclusiveSwitchGroup } from '../../../../components/ExclusiveSwitchGroup/index.js';
import { TaxonomyVariablePicker } from '../../../../components/TaxonomyVariablePicker/index.js';
import { variablePorCodigo } from '../../../../services/taxonomiaVariables.js';
import {
  opcionesContenido,
  programacionesDe,
} from '../../../../services/contenidosAdmin.js';
import { FORMATO_FECHA, TIPO_ENTRADA } from '../../../../types/tipoEntrada.js';
import {
  opcionesDimensionPerfilClinico,
  opcionesTipoEntrada,
  opcionesValorPerfilClinico,
  opcionVacia,
  tipoEntradaOcultoEnGrupal,
} from '../../../../services/nodosAdmin.js';

const OPCIONES_DIMENSION_PERFIL_CLINICO = opcionesDimensionPerfilClinico();

const OPCIONES_FORMATO_FECHA = [
  { value: FORMATO_FECHA.FECHA, label: 'Solo fecha' },
  { value: FORMATO_FECHA.HORA, label: 'Solo hora' },
  { value: FORMATO_FECHA.FECHA_HORA, label: 'Fecha y hora' },
];

/*
 * Crear o editar un nodo de un flujo en borrador (RF-25). Edita el tipo,
 * el texto, si es el nodo inicial, el orden, opcionalmente el contenido
 * asociado (solo contenido ya programado en un cronograma, vía
 * `contenidos`, con sus cronogramas, unidades y fechas) y, opcionalmente, la respuesta que espera el
 * nodo del estudiante (PR4): sin ella, el nodo es informativo. RF-25:
 * "nodo inicial" y "nodo final" son excluyentes, y la captura de perfil
 * clínico elige su valor con interruptores (solo uno activo). Los
 * subcampos de la respuesta cambian según el tipo elegido, igual que el
 * formulario de transiciones con su regla de validación. Los errores van
 * en texto, junto a cada campo. Vive dentro de ChatAdminModal: el título y
 * los botones Cancelar/Crear son del modal, que envía el formulario `formId`.
 */
export function NodeEditorForm({
  formId,
  values,
  errors,
  saving,
  saveError,
  tiposNodo,
  contenidos = [],
  variables = [],
  onChange,
  onSubmit,
}) {
  // RF-30B: la variable elegida filtra los tipos de respuesta del nodo.
  const variable = variablePorCodigo(variables, values.variableCodigo);

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
      <SelectField
        id="nodo-tipo"
        label="Tipo de nodo"
        required
        disabled={saving}
        value={values.idTipoNodo}
        options={tiposNodo}
        error={errors.idTipoNodo}
        onChange={(event) => onChange('idTipoNodo', event.target.value)}
      />

      <div className="flex flex-col gap-[6px]">
        <label
          htmlFor="nodo-texto"
          className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
        >
          Texto del nodo
          <span className="text-[var(--danger-text)]" aria-hidden="true">
            *
          </span>
        </label>

        <textarea
          id="nodo-texto"
          rows={5}
          required
          disabled={saving}
          value={values.texto}
          aria-invalid={Boolean(errors.texto)}
          aria-describedby={errors.texto ? 'nodo-texto-error' : undefined}
          className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] leading-[1.5] text-[var(--text-primary)] focus:border-[var(--brand-400)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] ${
            errors.texto
              ? 'border-[var(--danger)]'
              : 'border-[var(--surface-border)]'
          }`}
          onChange={(event) => onChange('texto', event.target.value)}
        />

        {errors.texto && (
          <p
            id="nodo-texto-error"
            role="alert"
            className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
          >
            {errors.texto}
          </p>
        )}
      </div>

      <TextField
        id="nodo-orden"
        label="Orden"
        type="number"
        inputMode="numeric"
        min={1}
        className="md:max-w-[200px]"
        disabled={saving}
        value={values.orden}
        error={errors.orden}
        hint="Opcional. Número entero desde 1."
        onChange={(event) => onChange('orden', event.target.value)}
      />

      <SelectField
        id="nodo-contenido-cronograma"
        label="Contenido asociado"
        disabled={saving}
        value={values.idContenido}
        options={opcionesContenido(contenidos)}
        placeholder="Sin contenido asociado"
        hint="Solo contenido ya programado en una unidad temporal de un cronograma."
        error={errors.idContenido}
        onChange={(event) => onChange('idContenido', event.target.value)}
      />

      {values.idContenido && (
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            Cada estudiante podrá responder este nodo cuando el contenido se
            habilite en su propio cronograma (RF-24); antes verá la fecha en que
            se habilita.
          </p>
          <ContenidoProgramacion
            programaciones={programacionesDe(values.idContenido, contenidos)}
          />
        </div>
      )}

      {!values.esNodoFinal && (
        <TaxonomyVariablePicker
          variables={variables}
          value={values.variableCodigo}
          error={errors.variableCodigo}
          disabled={saving}
          onChange={(codigo) => onChange('variableCodigo', codigo)}
        />
      )}

      <Checkbox
        id="nodo-tiene-entrada"
        checked={values.tieneEntrada && !values.esNodoFinal}
        disabled={saving || values.esNodoFinal || Boolean(variable)}
        onChange={(event) => onChange('tieneEntrada', event.target.checked)}
      >
        Este nodo espera una respuesta del estudiante
      </Checkbox>

      {!values.tieneEntrada && !values.esNodoFinal && (
        <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
          Sin respuesta, el estudiante solo pulsa “Continuar”. Si el nodo no
          tiene transiciones, avanza al siguiente nodo por orden.
        </p>
      )}

      {values.tieneEntrada && !values.esNodoFinal && (
        <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)]">
          <SelectField
            id="nodo-entrada-tipo"
            label="Tipo de respuesta"
            required
            disabled={saving}
            value={values.entradaTipo}
            options={opcionesTipoEntrada(values.entradaTipo, variable)}
            hint={
              variable
                ? `Filtrado por la variable «${variable.nombre}».`
                : undefined
            }
            onChange={(event) => onChange('entradaTipo', event.target.value)}
          />

          {tipoEntradaOcultoEnGrupal(values.entradaTipo) && (
            <ChatAdminNotice
              tone="warning"
              title="Tipo de respuesta no disponible"
            >
              Este tipo de respuesta no se edita aquí: elige otro para que sus
              transiciones puedan definir un valor esperado.
            </ChatAdminNotice>
          )}

          {(values.entradaTipo === TIPO_ENTRADA.OPCION_UNICA ||
            values.entradaTipo === TIPO_ENTRADA.MULTISELECCION) && (
            <>
              <div className="flex flex-col gap-[var(--space-2)]">
                <span className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
                  Opciones
                  <span
                    className="text-[var(--danger-text)]"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </span>

                <div
                  className="flex flex-col gap-[var(--space-2)]"
                  role="group"
                  aria-describedby={
                    errors.entradaOpciones
                      ? 'nodo-entrada-opciones-error'
                      : undefined
                  }
                >
                  {values.entradaOpciones.map((opcion, indice) => (
                    <div
                      key={indice}
                      className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-start"
                    >
                      <TextField
                        id={`nodo-entrada-opcion-valor-${indice}`}
                        label={`Opción ${indice + 1}`}
                        className="flex-1"
                        disabled={saving}
                        value={opcion.valor}
                        onChange={(event) =>
                          onChange(
                            'entradaOpciones',
                            values.entradaOpciones.map((item, i) =>
                              i === indice
                                ? { ...item, valor: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <TextField
                        id={`nodo-entrada-opcion-etiqueta-${indice}`}
                        label="Etiqueta (opcional)"
                        className="flex-1"
                        disabled={saving}
                        value={opcion.etiqueta}
                        hint="Si la dejas vacía, se muestra el valor."
                        onChange={(event) =>
                          onChange(
                            'entradaOpciones',
                            values.entradaOpciones.map((item, i) =>
                              i === indice
                                ? { ...item, etiqueta: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        className="sm:mt-[26px]"
                        disabled={saving}
                        aria-label={`Quitar opción ${indice + 1}`}
                        onClick={() =>
                          onChange(
                            'entradaOpciones',
                            values.entradaOpciones.filter(
                              (_, i) => i !== indice,
                            ),
                          )
                        }
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  className="self-start"
                  disabled={saving}
                  onClick={() =>
                    onChange('entradaOpciones', [
                      ...values.entradaOpciones,
                      opcionVacia(),
                    ])
                  }
                >
                  <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
                  Agregar opción
                </Button>

                {errors.entradaOpciones && (
                  <p
                    id="nodo-entrada-opciones-error"
                    role="alert"
                    className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
                  >
                    {errors.entradaOpciones}
                  </p>
                )}
              </div>

              {values.entradaTipo === TIPO_ENTRADA.MULTISELECCION && (
                <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                  <TextField
                    id="nodo-entrada-min-selecciones"
                    label="Mínimo de opciones a elegir"
                    type="number"
                    inputMode="numeric"
                    disabled={saving}
                    value={values.entradaMinSelecciones}
                    error={errors.entradaMinSelecciones}
                    onChange={(event) =>
                      onChange('entradaMinSelecciones', event.target.value)
                    }
                  />
                  <TextField
                    id="nodo-entrada-max-selecciones"
                    label="Máximo de opciones a elegir"
                    type="number"
                    inputMode="numeric"
                    disabled={saving}
                    value={values.entradaMaxSelecciones}
                    error={errors.entradaMaxSelecciones}
                    onChange={(event) =>
                      onChange('entradaMaxSelecciones', event.target.value)
                    }
                  />
                </div>
              )}
            </>
          )}

          {(values.entradaTipo === TIPO_ENTRADA.ESCALA ||
            values.entradaTipo === TIPO_ENTRADA.NUMERICO) && (
            <>
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                <TextField
                  id="nodo-entrada-min"
                  label="Mínimo"
                  type="number"
                  inputMode="decimal"
                  required
                  disabled={saving}
                  value={values.entradaMin}
                  error={errors.entradaMin}
                  onChange={(event) =>
                    onChange('entradaMin', event.target.value)
                  }
                />
                <TextField
                  id="nodo-entrada-max"
                  label="Máximo"
                  type="number"
                  inputMode="decimal"
                  required
                  disabled={saving}
                  value={values.entradaMax}
                  error={errors.entradaMax}
                  onChange={(event) =>
                    onChange('entradaMax', event.target.value)
                  }
                />
              </div>

              {values.entradaTipo === TIPO_ENTRADA.ESCALA && (
                <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                  <TextField
                    id="nodo-entrada-etiqueta-min"
                    label="Etiqueta del mínimo"
                    disabled={saving}
                    value={values.entradaEtiquetaMin}
                    hint="Por ejemplo: Nada de ansiedad"
                    onChange={(event) =>
                      onChange('entradaEtiquetaMin', event.target.value)
                    }
                  />
                  <TextField
                    id="nodo-entrada-etiqueta-max"
                    label="Etiqueta del máximo"
                    disabled={saving}
                    value={values.entradaEtiquetaMax}
                    hint="Por ejemplo: Ansiedad extrema"
                    onChange={(event) =>
                      onChange('entradaEtiquetaMax', event.target.value)
                    }
                  />
                </div>
              )}
            </>
          )}

          {values.entradaTipo === TIPO_ENTRADA.TEXTO_LIBRE && (
            <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3">
              <TextField
                id="nodo-entrada-min-palabras"
                label="Mínimo de palabras"
                type="number"
                inputMode="numeric"
                disabled={saving}
                value={values.entradaMinPalabras}
                onChange={(event) =>
                  onChange('entradaMinPalabras', event.target.value)
                }
              />
              <TextField
                id="nodo-entrada-max-palabras"
                label="Máximo de palabras"
                type="number"
                inputMode="numeric"
                disabled={saving}
                value={values.entradaMaxPalabras}
                error={errors.entradaMaxPalabras}
                onChange={(event) =>
                  onChange('entradaMaxPalabras', event.target.value)
                }
              />
              <TextField
                id="nodo-entrada-max-caracteres"
                label="Máximo de caracteres"
                type="number"
                inputMode="numeric"
                disabled={saving}
                value={values.entradaMaxCaracteres}
                onChange={(event) =>
                  onChange('entradaMaxCaracteres', event.target.value)
                }
              />
            </div>
          )}

          {values.entradaTipo === TIPO_ENTRADA.FECHA_HORA && (
            <SelectField
              id="nodo-entrada-formato"
              label="Formato"
              disabled={saving}
              value={values.entradaFormato}
              options={OPCIONES_FORMATO_FECHA}
              onChange={(event) =>
                onChange('entradaFormato', event.target.value)
              }
            />
          )}

          <Checkbox
            id="nodo-entrada-obligatorio"
            checked={values.entradaObligatorio}
            disabled={saving}
            onChange={(event) =>
              onChange('entradaObligatorio', event.target.checked)
            }
          >
            La respuesta es obligatoria
          </Checkbox>
        </div>
      )}

      {!values.esNodoFinal && (
        <SelectField
          id="nodo-captura-perfil"
          label="Captura de perfil clínico"
          disabled={saving}
          value={values.capturaPerfilDimension}
          options={OPCIONES_DIMENSION_PERFIL_CLINICO}
          placeholder="Este nodo no captura perfil clínico"
          hint="Solo para árboles grupales: cuando el estudiante pasa por este nodo, su perfil queda con el valor activado (RF-27B). El árbol publicado debe tener nodos para cada valor de cada dimensión."
          onChange={(event) =>
            onChange('capturaPerfilDimension', event.target.value)
          }
        />
      )}

      {values.capturaPerfilDimension && !values.esNodoFinal && (
        <ExclusiveSwitchGroup
          id="nodo-captura-perfil-valor"
          legend="Valor que captura este nodo"
          options={opcionesValorPerfilClinico(values.capturaPerfilDimension)}
          value={values.capturaPerfilValor}
          error={errors.capturaPerfilValor}
          hint="Solo un valor puede estar activado."
          disabled={saving}
          onChange={(valor) => onChange('capturaPerfilValor', valor)}
        />
      )}

      <Checkbox
        id="nodo-inicial"
        checked={values.esNodoInicial}
        disabled={saving || values.esNodoFinal}
        onChange={(event) => onChange('esNodoInicial', event.target.checked)}
      >
        Es el nodo inicial del flujo
      </Checkbox>

      <Checkbox
        id="nodo-final"
        checked={values.esNodoFinal}
        disabled={saving || values.esNodoInicial}
        error={errors.esNodoFinal}
        onChange={(event) => onChange('esNodoFinal', event.target.checked)}
      >
        Es el nodo final del flujo
      </Checkbox>

      {(values.esNodoInicial || values.esNodoFinal) && (
        <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
          {values.esNodoFinal
            ? 'El nodo final cierra la terapia: no espera respuesta ni tiene transiciones de salida, y no puede ser el nodo inicial.'
            : 'El nodo inicial no puede ser también el nodo final.'}
        </p>
      )}

      {saveError && (
        <ChatAdminNotice
          tone="danger"
          role="alert"
          title="No se pudo guardar el nodo"
        >
          {saveError}
        </ChatAdminNotice>
      )}
    </form>
  );
}
