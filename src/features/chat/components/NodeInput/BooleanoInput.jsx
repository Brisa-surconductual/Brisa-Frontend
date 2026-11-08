import { OpcionUnicaInput } from './OpcionUnicaInput.jsx';

export function BooleanoInput({ entrada, ...props }) {
  const opciones = [
    { valor: true, etiqueta: entrada.etiqueta_verdadero },
    { valor: false, etiqueta: entrada.etiqueta_falso },
  ];

  return <OpcionUnicaInput entrada={{ ...entrada, opciones }} {...props} />;
}
