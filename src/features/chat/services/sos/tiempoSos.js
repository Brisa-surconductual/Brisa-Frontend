/*
 * RF-43: cuenta regresiva de la intervención. El límite lo fija el
 * backend (`inicio_servidor` y `fin_maximo_servidor`, reloj de
 * PostgreSQL); el cliente no supone 60 s.
 *
 * Desfase del reloj: solo se usa la DURACIÓN del servidor
 * (fin − inicio), nunca la hora absoluta del dispositivo.
 * Latencia: el servidor abrió la intervención en algún momento entre el
 * envío del POST y la llegada de la respuesta; la cuenta se ancla al
 * envío, el instante más temprano posible. Así el tiempo mostrado nunca es
 * mayor que el real del servidor.
 * Pestaña oculta o equipo suspendido: el transcurrido es el mayor entre el
 * reloj monotónico (inmune a cambios de hora) y el reloj de pared (sigue
 * avanzando durante la suspensión), y se recalcula en cada lectura.
 */
export const RELOJ_NAVEGADOR = Object.freeze({
  mono: () => globalThis.performance?.now?.() ?? Date.now(),
  epoch: () => Date.now(),
});

export function leerReloj(reloj = RELOJ_NAVEGADOR) {
  return Object.freeze({ mono: reloj.mono(), epoch: reloj.epoch() });
}

// Duración en ms entre las dos marcas del servidor, o null si no son
// fechas válidas o el fin no es posterior al inicio.
export function duracionServidorMs(inicioServidor, finServidor) {
  const inicio = Date.parse(inicioServidor);
  const fin = Date.parse(finServidor);

  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) {
    return null;
  }

  return fin - inicio;
}

export function crearLimite(duracionMs, anclaje) {
  return Object.freeze({
    duracionMs,
    mono: anclaje.mono,
    epoch: anclaje.epoch,
  });
}

export function restanteMs(limite, ahora) {
  const transcurrido = Math.max(
    ahora.mono - limite.mono,
    ahora.epoch - limite.epoch,
    0,
  );

  return Math.max(limite.duracionMs - transcurrido, 0);
}

const dosDigitos = (n) => String(n).padStart(2, '0');

// «0:45». Se redondea hacia arriba: «0:00» solo cuando ya no queda nada.
export function formatearRestante(ms) {
  const segundos = Math.ceil(Math.max(ms ?? 0, 0) / 1000);

  return `${Math.floor(segundos / 60)}:${dosDigitos(segundos % 60)}`;
}

// Texto accesible del temporizador: «45 segundos».
export function describirRestante(ms) {
  const segundos = Math.ceil(Math.max(ms ?? 0, 0) / 1000);

  return segundos === 1 ? '1 segundo' : `${segundos} segundos`;
}

// Duración definitiva que devolvió el backend (`duracion_segundos`).
export function formatearDuracion(segundos) {
  if (!Number.isInteger(segundos) || segundos < 0) return null;
  if (segundos < 60)
    return segundos === 1 ? '1 segundo' : `${segundos} segundos`;

  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  const textoMinutos = minutos === 1 ? '1 minuto' : `${minutos} minutos`;

  return resto === 0 ? textoMinutos : `${textoMinutos} y ${resto} s`;
}
