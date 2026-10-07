import { TIPO_ENTRADA } from '../../types/index.js';
import { BooleanoInput } from './BooleanoInput.jsx';
import { booleano } from './booleano.js';
import { SeleccionMultipleInput } from './SeleccionMultipleInput.jsx';
import { seleccionMultiple } from './seleccionMultiple.js';
import { SeleccionUnicaInput } from './SeleccionUnicaInput.jsx';
import { seleccionUnica } from './seleccionUnica.js';

// Registro de componentes por `tipo_entrada` (CLAUDE.md, M03): agregar un
// tipo es agregar una entrada aquí, sin tocar el formulario.
// Cada entrada: { Componente, validar, textoRespuesta } y, opcionales,
// envioInmediato (elegir ya envía) y normalizar (ajusta el valor antes de
// validar).
export const REGISTRO_ENTRADAS = Object.freeze({
  [TIPO_ENTRADA.SELECCION_UNICA]: Object.freeze({
    Componente: SeleccionUnicaInput,
    ...seleccionUnica,
    envioInmediato: true,
  }),
  [TIPO_ENTRADA.SELECCION_MULTIPLE]: Object.freeze({
    Componente: SeleccionMultipleInput,
    ...seleccionMultiple,
  }),
  [TIPO_ENTRADA.BOOLEANO]: Object.freeze({
    Componente: BooleanoInput,
    ...booleano,
    envioInmediato: true,
  }),
});
