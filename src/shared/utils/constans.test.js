import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function cargarConstantes(apiUrl, location = { origin: 'http://localhost:5173' }) {
  vi.stubEnv('VITE_API_URL', apiUrl);
  if (location) {
    vi.stubGlobal('location', location);
  }
  vi.resetModules();
  return import('./constans.jsx');
}

it.each([
  ['ruta relativa', '/api', 'http://localhost:5173/api'],
  ['ruta relativa con barras finales', '/api///', 'http://localhost:5173/api'],
  ['origen absoluto', 'https://api.brisa.test///', 'https://api.brisa.test'],
  ['configuración ausente', undefined, 'http://localhost:3001'],
])('resuelve la API para %s', async (_caso, apiUrl, expected) => {
  const { BASE_URL, USUARIOS, CRONOGRAMA, CHAT } = await cargarConstantes(apiUrl);

  expect(BASE_URL).toBe(expected);
  expect(USUARIOS).toBe(`${expected}/usuarios`);
  expect(CRONOGRAMA).toBe(`${expected}/cronograma`);
  expect(CHAT).toBe(`${expected}/chat`);
});

it('respeta el proxy configurado y mantiene un solo prefijo de API', async () => {
  vi.stubGlobal('location', { origin: 'https://brisa.example' });
  vi.stubEnv('VITE_API_URL', '/api/');
  const { BASE_URL, CHAT } = await import('./constans.jsx');

  expect(BASE_URL).toBe('https://brisa.example/api');
  expect(CHAT).toBe('https://brisa.example/api/chat');
});

it('usa el origen local cuando no hay navegador', async () => {
  const { BASE_URL } = await cargarConstantes('/api', null);
  expect(BASE_URL).toBe('http://localhost:5173/api');
});

it('conserva una secuencia larga de barras dentro de la ruta', async () => {
  const apiUrl = `https://api.brisa.test/${'/'.repeat(100_000)}recurso`;
  const { BASE_URL } = await cargarConstantes(apiUrl);
  expect(BASE_URL).toBe(apiUrl);
});

it('elimina una secuencia larga de barras finales', async () => {
  const { BASE_URL } = await cargarConstantes(`https://api.brisa.test/api${'/'.repeat(100_000)}`);
  expect(BASE_URL).toBe('https://api.brisa.test/api');
});