import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/[[path]].js';

const env = { BACKEND_ORIGIN: 'https://brisa-example.onrender.com' };

test('conserva cookies y CSRF y elimina encabezados de módulos internos', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(
      url.href,
      'https://brisa-example.onrender.com/usuarios/cerrar-sesion',
    );
    assert.equal(options.method, 'POST');
    assert.equal(
      await new Response(options.body).text(),
      JSON.stringify({ reason: 'logout' }),
    );
    assert.equal(options.headers.get('cookie'), '__Host-brisa_session=test');
    assert.equal(options.headers.get('x-csrf-token'), 'csrf-test');
    assert.equal(options.headers.get('authorization'), null);
    assert.equal(options.headers.get('x-module-code'), null);
    assert.equal(options.headers.get('x-forwarded-for'), null);
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 204 });
  });
  const request = new Request(
    'https://brisa.pages.dev/api/usuarios/cerrar-sesion',
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'logout' }),
      headers: {
        Cookie: '__Host-brisa_session=test',
        'X-CSRF-Token': 'csrf-test',
        Authorization: 'Bearer untrusted',
        'X-Module-Code': 'CHAT',
        'X-Forwarded-For': 'untrusted',
      },
    },
  );
  const result = await onRequest({ request, env });
  assert.equal(result.status, 204);
  assert.equal(await result.text(), '');
});

test('el destino permanece fijo aunque la ruta intente cambiar de host', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.origin, env.BACKEND_ORIGIN);
    assert.equal(url.pathname, '//other.example/usuarios');
    assert.equal(url.search, '?page=2');
    return Response.json([]);
  });
  const request = new Request(
    'https://brisa.pages.dev/api//other.example/usuarios?page=2',
  );
  assert.equal((await onRequest({ request, env })).status, 200);
});

test('conserva los errores de negocio y la cookie emitida por el backend', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response('denied', {
        status: 403,
        headers: {
          'Set-Cookie':
            '__Host-brisa_session=; Max-Age=0; Path=/; Secure; HttpOnly',
        },
      }),
  );
  const result = await onRequest({
    request: new Request('https://brisa.pages.dev/api/usuarios'),
    env,
  });
  assert.equal(result.status, 403);
  assert.match(result.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(await result.text(), 'denied');
});

test('rechaza configuración ausente o con credenciales sin contactar otro servidor', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () =>
    assert.fail('unexpected fetch'),
  );
  for (const backend of [
    undefined,
    'http://example.com',
    'https://user:secret@example.com',
    'https://example.com/path',
  ]) {
    const result = await onRequest({
      request: new Request('https://brisa.pages.dev/api/usuarios'),
      env: { BACKEND_ORIGIN: backend },
    });
    assert.equal(result.status, 503);
    assert.equal(
      (await result.json()).message,
      'El servicio no está configurado.',
    );
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('sanitiza errores de red sin exponer detalles del backend', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('private details');
  });
  const result = await onRequest({
    request: new Request('https://brisa.pages.dev/api/usuarios'),
    env,
  });
  assert.equal(result.status, 502);
  assert.doesNotMatch(await result.text(), /private details/);
});
