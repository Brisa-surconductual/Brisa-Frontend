import {
  CHAT_STORAGE_ERROR,
  createChatStorageError,
} from './chatStorageError.js';

// Comprobaciones mínimas de forma antes de escribir: un registro que no
// cumple el contrato no entra en la base.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esTexto = (valor) =>
  typeof valor === 'string' && valor.trim() !== '';

export const esUuid = (valor) => typeof valor === 'string' && UUID.test(valor);

export const esEnteroNoNegativo = (valor) =>
  Number.isInteger(valor) && valor >= 0;

export const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor > 0;

export const esDeCatalogo = (catalogo, valor) =>
  Object.values(catalogo).includes(valor);

export function exigir(condicion) {
  if (!condicion)
    throw createChatStorageError(CHAT_STORAGE_ERROR.DATOS_INVALIDOS);
}

// La identidad del usuario es obligatoria en toda consulta de sesión.
export const exigirUsuario = (idUsuario) => exigir(esTexto(idUsuario));
