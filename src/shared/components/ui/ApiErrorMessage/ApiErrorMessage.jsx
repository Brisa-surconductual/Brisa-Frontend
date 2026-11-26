import { AlertCircle } from 'lucide-react';

import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import { Button } from '../Button';

// Los dos únicos textos propios (D2): no hay mensaje del backend que mostrar.
const TEXTO_SIN_CONEXION =
  'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
const TEXTO_DESCONOCIDO = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

export function ApiErrorMessage({ error, variant = 'block', onRetry, id }) {
  if (!error) return null;

  const texto =
    error.mensaje ||
    (error.codigo === API_ERROR_CLIENTE.SIN_CONEXION
      ? TEXTO_SIN_CONEXION
      : TEXTO_DESCONOCIDO);

  if (variant === 'inline') {
    return (
      <p
        id={id}
        aria-live="polite"
        className="m-0 flex items-start gap-[var(--space-1)] text-[length:var(--font-size-sm)] text-[var(--danger-text)]"
      >
        <AlertCircle
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
          className="mt-px shrink-0"
        />
        <span className="text-pretty">{texto}</span>
      </p>
    );
  }

  // D3: reintentar solo si no hubo respuesta o fue un 5xx.
  const puedeReintentar = Boolean(onRetry) && error.reintentable === true;

  return (
    <div
      id={id}
      role="alert"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]"
    >
      <div className="flex items-start gap-[var(--space-2)]">
        <AlertCircle
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0"
        />
        <p className="m-0 text-pretty">{texto}</p>
      </div>

      {puedeReintentar && (
        <Button
          variant="secondary"
          size="large"
          onClick={onRetry}
          className="self-start"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
}
