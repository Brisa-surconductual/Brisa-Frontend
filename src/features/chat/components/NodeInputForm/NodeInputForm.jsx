import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import { TIPO_BLOQUE, TIPO_ENTRADA } from '../../types/index.js';
import { REGISTRO_ENTRADAS } from '../NodeInput/registroEntradas.js';

import { resolverRespuesta } from './resolverRespuesta.js';

// D9: texto de interfaz, no un error de API. Se queda para tipos que la
// aplicación no conoce: un tipo nuevo del backend no rompe la pantalla.
const AVISO_NO_DISPONIBLE =
  'Esta pregunta todavía no se puede responder en la aplicación.';

// Controles que pueden recibir el foco tras un 400 si no hay opción
// elegida.
export const SELECTOR_FOCO = 'input, textarea, button';

// Quien lo usa debe montarlo con una `key` por nodo: al cambiar de nodo,
// React reinicia el valor sin efectos. Tras un 400 la `key` no cambia y la
// respuesta sigue editable (CA-28-2).
// `errorExterno`: error de validación del backend, que se muestra tal cual
// (D10). `enviando` bloquea todo (D12).
export function NodeInputForm({
  nodo,
  onResponder,
  enviando = false,
  errorExterno = null,
}) {
  const id = useId();
  const formRef = useRef(null);
  const [valor, setValor] = useState(null);

  // Tras un 400 el control que tenía el foco estuvo deshabilitado y lo
  // soltó: vuelve a la opción elegida o al primer control (WCAG 2.4.3).
  useEffect(() => {
    if (!errorExterno || enviando) return;

    const form = formRef.current;
    (
      form?.querySelector('[data-elegida]') ??
      form?.querySelector(SELECTOR_FOCO)
    )?.focus();
  }, [errorExterno, enviando]);

  // D9: el nodo terminal no admite respuesta.
  if (nodo.esTerminal) return null;

  const { entrada } = nodo;
  const informativo = !entrada || entrada.tipo === TIPO_ENTRADA.CONTINUAR;
  const tipo =
    !informativo && Object.hasOwn(REGISTRO_ENTRADAS, entrada.tipo)
      ? REGISTRO_ENTRADAS[entrada.tipo]
      : null;

  if (!informativo && !tipo) {
    return (
      <p className="m-0 flex items-start gap-[var(--space-2)] border-t border-[var(--surface-border)] px-[var(--space-4)] pt-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
        <Info
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0"
        />
        {AVISO_NO_DISPONIBLE}
      </p>
    );
  }

  const idPregunta = `${id}-pregunta`;
  const idError = `${id}-error`;
  // Nombre accesible del componente: el primer bloque de texto del nodo.
  const pregunta = nodo.bloques?.find(
    (bloque) => bloque.tipo === TIPO_BLOQUE.TEXTO,
  )?.texto;
  // Sin "Continuar", un tipo de envío inmediato no obligatorio no podría
  // enviar `null`.
  const conContinuar =
    informativo || !tipo.envioInmediato || !entrada.obligatorio;

  function confirmar(v) {
    if (enviando) return;

    // CA-27-6: en un nodo informativo se envía CONTINUAR con valor null.
    onResponder(
      informativo
        ? { valor: null, textoRespuesta: null }
        : resolverRespuesta(entrada, tipo, v),
    );
  }

  function cambiar(nuevo) {
    setValor(nuevo);
    if (tipo.envioInmediato) confirmar(nuevo);
  }

  const Componente = tipo?.Componente;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        confirmar(valor);
      }}
      className="flex flex-col gap-[var(--space-2)] border-t border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-4)]"
    >
      {Componente && (
        <>
          <p className="m-0 text-[10px] font-bold tracking-[.07em] text-[var(--text-muted)] uppercase">
            Tu respuesta
          </p>
          <span id={idPregunta} className="sr-only">
            {pregunta}
          </span>
          <Componente
            entrada={entrada}
            valor={valor}
            onCambiar={cambiar}
            deshabilitado={enviando}
            idEtiqueta={pregunta ? idPregunta : undefined}
            idDescripcion={errorExterno ? idError : undefined}
          />
        </>
      )}

      {/* D10: la región queda montada; solo cambia su contenido. */}
      <div id={idError} aria-live="polite" aria-atomic="true">
        <ApiErrorMessage error={errorExterno} variant="inline" />
      </div>

      {conContinuar && (
        <Button type="submit" size="large" fullWidth disabled={enviando}>
          Continuar
        </Button>
      )}
    </form>
  );
}
