import { useId, useState } from 'react';
import { CircleAlert } from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';
import { REGISTRO_ENTRADAS } from '../NodeInput/registroEntradas.js';
import { resolverRespuesta } from './resolverRespuesta.js';

// Quien lo usa debe montarlo con key={nodo.id_nodo}: al cambiar de nodo,
// React reinicia el estado sin efectos.
// `errorExterno` solo recibe errores de categoría VALIDACION del backend.
export function NodeInputForm({
  nodo,
  onResponder,
  enviando = false,
  errorExterno = null,
}) {
  const id = useId();
  const [valor, setValor] = useState(null);
  const [errorLocal, setErrorLocal] = useState(null);
  const [externoDescartado, setExternoDescartado] = useState(null);

  const { entrada } = nodo;
  const tipo =
    entrada && Object.hasOwn(REGISTRO_ENTRADAS, entrada.tipo_entrada)
      ? REGISTRO_ENTRADAS[entrada.tipo_entrada]
      : null;

  // Tipo no registrado: no pinta nada. El aviso visible es de FE-M03-08.
  if (entrada && !tipo) return null;

  const idPregunta = `${id}-pregunta`;
  const idError = `${id}-error`;
  const error =
    errorLocal ??
    (errorExterno !== externoDescartado ? errorExterno?.message : null);
  // Sin "Continuar", un tipo de envío inmediato no obligatorio no podría
  // enviar `null` (contrato 5).
  const conContinuar = !entrada || !tipo.envioInmediato || !entrada.obligatorio;

  function confirmar(v) {
    if (!entrada) {
      onResponder({ respuesta: null, textoRespuesta: null });
      return;
    }
    const resultado = resolverRespuesta(entrada, tipo, v);
    if (!resultado.valido) {
      setErrorLocal(resultado.mensaje);
      return;
    }
    onResponder({
      respuesta: resultado.respuesta,
      textoRespuesta: resultado.textoRespuesta,
    });
  }

  function cambiar(nuevo) {
    setValor(nuevo);
    setErrorLocal(null);
    setExternoDescartado(errorExterno);
    if (tipo.envioInmediato) confirmar(nuevo);
  }

  const Componente = tipo?.Componente;

  return (
    <form
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
            {nodo.contenido?.texto}
          </span>
          <Componente
            entrada={entrada}
            valor={valor}
            onCambiar={cambiar}
            deshabilitado={enviando}
            idEtiqueta={idPregunta}
            idDescripcion={error ? idError : undefined}
          />
        </>
      )}

      {error && (
        <p
          id={idError}
          role="alert"
          className="m-0 flex items-center gap-[var(--space-1)] text-[12px] text-[var(--danger-text)]"
        >
          <CircleAlert
            size={14}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0"
          />
          {error}
        </p>
      )}

      {conContinuar && (
        <Button type="submit" size="large" fullWidth disabled={enviando}>
          Continuar
        </Button>
      )}
    </form>
  );
}
