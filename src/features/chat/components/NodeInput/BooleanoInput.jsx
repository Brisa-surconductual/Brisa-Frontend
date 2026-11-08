import { opcionesBooleano } from './booleano.js';
import { OpcionUnicaInput } from './OpcionUnicaInput.jsx';

export function BooleanoInput({ entrada, ...props }) {
  return (
    <OpcionUnicaInput
      entrada={{ ...entrada, opciones: opcionesBooleano(entrada) }}
      {...props}
    />
  );
}
