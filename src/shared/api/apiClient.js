const DEFAULT_API_URL = 'http://localhost:3000';

const API_URL = (
  import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data, fallbackMessage) {
  if (Array.isArray(data?.message)) {
    return data.message.join(' ');
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (typeof data?.error === 'string') {
    return data.error;
  }

  return fallbackMessage || 'Ocurrió un error al comunicarse con el servidor.';
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    headers = {},
  } = {},
) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,

      /*
       * Obligatorio porque Backend maneja la
       * autenticación mediante cookie HttpOnly.
       */
      credentials: 'include',

      headers: {
        Accept: 'application/json',

        ...(body !== undefined
          ? {
              'Content-Type': 'application/json',
            }
          : {}),

        ...headers,
      },

      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw new ApiError(
      'No fue posible conectarse con el servidor.',
      {
        status: 0,
      },
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, response.statusText),
      {
        status: response.status,
        data,
      },
    );
  }

  return data;
}