const configuredApi = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
const pageOrigin = globalThis.location?.origin || 'http://localhost:5173';

// Una URL absoluta evita duplicar /api al combinar Axios con USUARIOS/CRONOGRAMA.
const absoluteApiUrl = new URL(configuredApi, pageOrigin).href;
let baseUrlEnd = absoluteApiUrl.length;
while (baseUrlEnd > 0 && absoluteApiUrl[baseUrlEnd - 1] === '/') {
  baseUrlEnd -= 1;
}
export const BASE_URL = absoluteApiUrl.slice(0, baseUrlEnd);

export const USUARIOS = `${BASE_URL}/usuarios`;
export const CRONOGRAMA = `${BASE_URL}/cronograma`;
