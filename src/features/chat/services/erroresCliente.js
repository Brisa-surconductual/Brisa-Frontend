import { reportarErrorCliente } from '../api/sesion/reportarErrorCliente.js';

import { esIdSesionValido } from './nodoActual.js';

/*
 * RF-37: reporte de errores que el backend no puede ver (presentación,
 * recursos multimedia que el navegador no cargó, falta de conexión).
 * - Operación secundaria: nunca lanza ni bloquea la conversación.
 * - Solo `codigo` e `id_sesion` (contrato); nunca trazas, mensajes ni
 *   respuestas del estudiante.
 * - Los errores HTTP no se reportan: el backend ya los registra.
 * - Un fallo del propio reporte no se reporta (sin recursión).
 * - Límite propio por debajo del del backend (10 por minuto), un mismo
 *   código por sesión una vez por minuto y pausa tras un 429.
 * - Sin conexión el reporte no puede llegar: se guarda uno pendiente de
 *   SIN_CONEXION en memoria y se intenta una sola vez al volver la red. No
 *   hay garantía de entrega.
 */
export const CODIGO_ERROR_CLIENTE = Object.freeze({
  ERROR_PRESENTACION: 'ERROR_PRESENTACION',
  RECURSO_NO_DISPONIBLE: 'RECURSO_NO_DISPONIBLE',
  SIN_CONEXION: 'SIN_CONEXION',
});

const CODIGOS = Object.freeze(Object.values(CODIGO_ERROR_CLIENTE));
const VENTANA_MS = 60 * 1000;
const MAXIMO_POR_VENTANA = 5;

let enviados = [];
let ultimos = new Map();
let pausaHasta = 0;
let pendiente = null;
let escuchandoRed = false;

function escucharVueltaDeRed() {
  if (escuchandoRed || typeof window === 'undefined') return;

  escuchandoRed = true;
  window.addEventListener(
    'online',
    () => {
      escuchandoRed = false;
      void reintentarReportePendiente();
    },
    { once: true },
  );
}

/**
 * Registra un error del cliente. Devuelve `true` si el backend lo aceptó;
 * `false` si se descartó o falló. Nunca rechaza.
 */
export async function registrarErrorCliente(
  { codigo, idSesion = null },
  { enviar = reportarErrorCliente, ahora = Date.now() } = {},
) {
  if (!CODIGOS.includes(codigo) || ahora < pausaHasta) return false;

  const sesion = esIdSesionValido(idSesion) ? idSesion : null;
  const clave = `${codigo}|${sesion ?? ''}`;

  enviados = enviados.filter((t) => ahora - t < VENTANA_MS);
  if (enviados.length >= MAXIMO_POR_VENTANA) return false;
  if (ahora - (ultimos.get(clave) ?? -Infinity) < VENTANA_MS) return false;

  enviados.push(ahora);
  ultimos.set(clave, ahora);

  try {
    await enviar({ codigo, idSesion: sesion });
    return true;
  } catch (error) {
    if (error?.status === 429) pausaHasta = ahora + VENTANA_MS;
    if (error?.status == null && codigo === CODIGO_ERROR_CLIENTE.SIN_CONEXION) {
      // Se libera la clave para que el reintento al volver la red no se
      // descarte como repetido.
      ultimos.delete(clave);
      pendiente = { codigo, idSesion: sesion };
      escucharVueltaDeRed();
    }
    return false;
  }
}

// Un único reintento del SIN_CONEXION pendiente.
export async function reintentarReportePendiente(opciones) {
  if (!pendiente) return false;

  const reporte = pendiente;
  pendiente = null;

  return registrarErrorCliente(reporte, opciones);
}

// Solo para pruebas.
export function reiniciarErroresCliente() {
  enviados = [];
  ultimos = new Map();
  pausaHasta = 0;
  pendiente = null;
}
