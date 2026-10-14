const configuredApi = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
const pageOrigin = globalThis.location?.origin || 'http://localhost:5173';

// Una URL absoluta evita duplicar /api al combinar Axios con USUARIOS/CRONOGRAMA.
export const BASE_URL = new URL(configuredApi, pageOrigin).href.replace(/\/+$/, '');

export const USUARIOS = `${BASE_URL}/usuarios`;
export const CRONOGRAMA = `${BASE_URL}/cronograma`;
