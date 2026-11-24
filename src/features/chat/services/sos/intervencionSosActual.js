import { crearControladorSos } from './controladorSos.js';

/*
 * RF-43: la intervención SOS de esta pestaña. Solo en memoria: nunca en
 * localStorage, sessionStorage ni en el estado del historial (llevaría
 * contenido del ejercicio y, durante un envío, una respuesta del
 * estudiante). Tras F5 no hay nada que retomar.
 *
 * Un toque con una intervención en curso no activa otra: devuelve la que
 * ya existe (doble toque, otro toque tras salir de la pantalla SOS).
 */
let actual = null;

export function solicitarIntervencionSos(
  { contexto = null, toque = null } = {},
  crear = crearControladorSos,
) {
  if (actual?.enCurso()) return actual;

  actual?.descartar();
  actual = crear({ contexto, toque });
  void actual.activar();

  return actual;
}

export const intervencionSosActual = () => actual;

// Al salir de la intervención terminada o al cerrar la sesión.
export function descartarIntervencionSos(controlador = actual) {
  if (!controlador || controlador !== actual) return;

  actual.descartar();
  actual = null;
}
