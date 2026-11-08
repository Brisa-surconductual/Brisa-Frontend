import { TIPO_ENTRADA } from '../../types/index.js';
import { BooleanoInput } from './BooleanoInput.jsx';
import { booleano } from './booleano.js';
import { EscalaInput } from './EscalaInput.jsx';
import { escala } from './escala.js';
import { NumericoInput } from './NumericoInput.jsx';
import { numerico } from './numerico.js';
import { MultiseleccionInput } from './MultiseleccionInput.jsx';
import { multiseleccion } from './multiseleccion.js';
import { OpcionUnicaInput } from './OpcionUnicaInput.jsx';
import { opcionUnica } from './opcionUnica.js';

// Registro de componentes por `tipo_entrada` (CLAUDE.md, M03): agregar un
// tipo es agregar una entrada aquí, sin tocar el formulario.
// Cada entrada: { Componente, validar, textoRespuesta } y, opcionales,
// envioInmediato (elegir ya envía) y normalizar (ajusta el valor antes de
// validar).
export const REGISTRO_ENTRADAS = Object.freeze({
  [TIPO_ENTRADA.OPCION_UNICA]: Object.freeze({
    Componente: OpcionUnicaInput,
    ...opcionUnica,
    envioInmediato: true,
  }),
  [TIPO_ENTRADA.MULTISELECCION]: Object.freeze({
    Componente: MultiseleccionInput,
    ...multiseleccion,
  }),
  [TIPO_ENTRADA.BOOLEANO]: Object.freeze({
    Componente: BooleanoInput,
    ...booleano,
    envioInmediato: true,
  }),
  [TIPO_ENTRADA.ESCALA]: Object.freeze({
    Componente: EscalaInput,
    ...escala,
  }),
  [TIPO_ENTRADA.NUMERICO]: Object.freeze({
    Componente: NumericoInput,
    ...numerico,
  }),
});
