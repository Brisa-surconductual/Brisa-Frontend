import { TIPO_ENTRADA } from '../../types/index.js';
import { BooleanoInput } from './BooleanoInput.jsx';
import { booleano } from './booleano.js';
import { EscalaInput } from './EscalaInput.jsx';
import { escala } from './escala.js';
import { FechaHoraInput } from './FechaHoraInput.jsx';
import { fechaHora } from './fechaHora.js';
import { NumericoInput } from './NumericoInput.jsx';
import { numerico } from './numerico.js';
import { MultiseleccionInput } from './MultiseleccionInput.jsx';
import { multiseleccion } from './multiseleccion.js';
import { TextoLibreInput } from './TextoLibreInput.jsx';
import { textoLibre } from './textoLibre.js';
import { OpcionUnicaInput } from './OpcionUnicaInput.jsx';
import { opcionUnica } from './opcionUnica.js';

// Registro de componentes por `entrada.tipo` (CLAUDE.md, M03): agregar un
// tipo es agregar una entrada aquí, sin tocar el formulario.
// Cada entrada: { Componente, textoRespuesta } y, opcionales,
// envioInmediato (elegir ya envía) y normalizar (convierte lo escrito al
// tipo que espera el backend). No hay `validar`: solo valida el backend
// (D2, RF-28).
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
  [TIPO_ENTRADA.FECHA_HORA]: Object.freeze({
    Componente: FechaHoraInput,
    ...fechaHora,
  }),
  [TIPO_ENTRADA.TEXTO_LIBRE]: Object.freeze({
    Componente: TextoLibreInput,
    ...textoLibre,
  }),
});
