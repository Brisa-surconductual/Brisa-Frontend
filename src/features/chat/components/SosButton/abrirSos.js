import { crearContextoOrigen } from '../../services/sos/contextoOrigenSos.js';
import { solicitarIntervencionSos } from '../../services/sos/intervencionSosActual.js';
import { marcarToqueSos } from '../../services/sos/medicionSos.js';
import { RELOJ_NAVEGADOR } from '../../services/sos/tiempoSos.js';
import { SOS_PATH } from '../../types/sos.js';

export const esRutaSos = (pathname) =>
  pathname === SOS_PATH || pathname.startsWith(`${SOS_PATH}/`);

/*
 * RF-43: un solo toque, sin confirmación. El POST sale en el mismo evento
 * del toque y la pantalla SOS se abre enseguida con el estado «abriendo».
 * Si ya hay una intervención en curso en esta pestaña no se activa otra:
 * solo se vuelve a su pantalla.
 */
export function abrirSos({
  location,
  navigate,
  solicitar = solicitarIntervencionSos,
  reloj = RELOJ_NAVEGADOR,
}) {
  if (esRutaSos(location.pathname)) return;

  marcarToqueSos();
  solicitar({ contexto: crearContextoOrigen(location), toque: reloj.mono() });
  navigate(SOS_PATH);
}

/*
 * Decide qué hace un `click` del botón: el que sigue a un arrastre se
 * ignora (y se consume); con el candado puesto (doble toque) tampoco se
 * activa. Devuelve true si el SOS se activó.
 */
export function activarDesdeClick({
  consumirClickDeArrastre,
  candadoRef,
  activar,
}) {
  if (consumirClickDeArrastre()) return false;
  if (candadoRef.current) return false;

  candadoRef.current = true;
  activar();
  return true;
}
