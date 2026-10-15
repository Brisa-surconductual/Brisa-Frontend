import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function cargarConstantes(apiUrl, location = { origin: 'https://brisa.pages.dev' }) {
  vi.stubEnv('VITE_API_URL', apiUrl);
  vi.stubGlobal('location', location);
  vi.resetModules();
  return import('./constans.jsx');
}

it.each([
  ['ruta relativa', '/api', 'https://brisa.pages.dev/api'],
  ['ruta relativa con barras finales', '/api///', 'https://brisa.pages.dev/api'],
  ['origen absoluto', 'https://api.brisa.test///', 'https://api.brisa.test'],
  ['configuración ausente', undefined, 'http://localhost:3000'],
])('resuelve la API para %s', async (_caso, apiUrl, expected) => {
  const { BASE_URL, USUARIOS, CRONOGRAMA } = await cargarConstantes(apiUrl);

  expect(BASE_URL).toBe(expected);
  expect(USUARIOS).toBe(`${expected}/usuarios`);
  expect(CRONOGRAMA).toBe(`${expected}/cronograma`);
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
