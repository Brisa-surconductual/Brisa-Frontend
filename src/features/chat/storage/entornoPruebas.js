import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

import { cerrarBrisaChatDb } from './brisaChatDb.js';

/*
 * Solo para pruebas: IndexedDB en memoria (fake-indexeddb). Cada prueba
 * empieza con una base vacía. Datos ficticios, nunca de participantes.
 */
export async function reiniciarIndexedDb() {
  await cerrarBrisaChatDb();
  globalThis.indexedDB = new IDBFactory();
}

export const USUARIO_A = 'usuario-ficticio-a';
export const USUARIO_B = 'usuario-ficticio-b';
export const SESION_1 = '11111111-1111-4111-8111-111111111111';
export const SESION_2 = '22222222-2222-4222-8222-222222222222';
export const AHORA = new Date('2026-11-13T21:10:00-05:00');

let contador = 0;

// UUID v4 ficticio y único por llamada.
export function uuidFicticio() {
  contador += 1;
  return `00000000-0000-4000-8000-${String(contador).padStart(12, '0')}`;
}

export const sesionLocal = (cambios = {}) => ({
  id_sesion: SESION_1,
  id_usuario: USUARIO_A,
  id_nodo_actual: 'nodo-1',
  ultima_secuencia: 0,
  estado_sesion_offline: 'EN_CURSO',
  ...cambios,
});

export const interaccion = (cambios = {}) => ({
  id_interaccion: uuidFicticio(),
  id_usuario: USUARIO_A,
  id_sesion: SESION_1,
  id_nodo: 'nodo-1',
  tipo_entrada: 'ESCALA',
  valor: 7,
  timestamp_interaccion: '2026-11-13T21:10:00-05:00',
  estado_conectividad: 'SIN_CONEXION',
  recursos_no_presentados: [],
  id_nodo_destino_local: 'nodo-2',
  ...cambios,
});

export const paquete = (cambios = {}) => ({
  id_sesion: SESION_1,
  id_usuario: USUARIO_A,
  id_flujo_conversacional: 'flujo-ficticio',
  version_arbol: 3,
  etag: 'flujo-ficticio:v3:unidad-ficticia',
  nodos: [
    {
      id_nodo: 'nodo-1',
      tipo_nodo: 'PREGUNTA',
      bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Texto ficticio' }],
    },
  ],
  estado_precarga: 'COMPLETA',
  descargado_en: '2026-11-13T20:06:10-05:00',
  ...cambios,
});
