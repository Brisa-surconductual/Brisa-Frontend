import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('conserva el backend local cuando no se configura una URL de API', async () => {
  vi.stubEnv('VITE_API_URL', '');
  const { BASE_URL } = await import('./constans.jsx');

  expect(BASE_URL).toBe('http://localhost:3001');
});

it('respeta el proxy configurado y mantiene un solo prefijo de API', async () => {
  vi.stubGlobal('location', { origin: 'https://brisa.example' });
  vi.stubEnv('VITE_API_URL', '/api/');
  const { BASE_URL, CHAT } = await import('./constans.jsx');

  expect(BASE_URL).toBe('https://brisa.example/api');
  expect(CHAT).toBe('https://brisa.example/api/chat');
});
