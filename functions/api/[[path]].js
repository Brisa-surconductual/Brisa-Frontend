const unavailable = (status, message) =>
  Response.json(
    { message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );

export async function onRequest({ request, env }) {
  let upstream;
  try {
    upstream = new URL(env.BACKEND_ORIGIN);
    if (
      upstream.protocol !== 'https:' ||
      upstream.username ||
      upstream.password ||
      upstream.pathname !== '/' ||
      upstream.search ||
      upstream.hash
    ) {
      throw new Error('Invalid backend origin');
    }
  } catch {
    return unavailable(503, 'El servicio no está configurado.');
  }

  const incoming = new URL(request.url);
  upstream.pathname = incoming.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  for (const name of [
    'host',
    'content-length',
    'connection',
    'authorization',
    'x-module-code',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
  ]) {
    headers.delete(name);
  }
  headers.set('x-forwarded-proto', 'https');
  const clientIp = request.headers.get('cf-connecting-ip');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      duplex: 'half',
      redirect: 'manual',
      signal: AbortSignal.timeout(90_000),
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return unavailable(
      502,
      'No fue posible conectar con el servicio. Intenta nuevamente.',
    );
  }
}
