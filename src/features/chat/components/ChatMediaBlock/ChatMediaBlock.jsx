import { FileText, ImageOff } from 'lucide-react';

import { TIPO_BLOQUE } from '../../types/index.js';

// D7: texto de interfaz, no un error de API.
const AVISO_NO_DISPONIBLE = 'No se pudo cargar este recurso.';

// D18: sin `textoAlternativo`, el nombre accesible es el del tipo.
const NOMBRE_POR_TIPO = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: 'Imagen',
  [TIPO_BLOQUE.GIF]: 'Imagen',
  [TIPO_BLOQUE.VIDEO]: 'Video',
  [TIPO_BLOQUE.AUDIO]: 'Audio',
  [TIPO_BLOQUE.DOCUMENTO]: 'Documento',
});

const nombreAccesible = (bloque) =>
  bloque.textoAlternativo || NOMBRE_POR_TIPO[bloque.tipo];

const MEDIA_CLASS =
  'block w-full rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)]';

function Imagen({ bloque, onError }) {
  return (
    <img
      src={bloque.url}
      alt={nombreAccesible(bloque)}
      loading="lazy"
      onError={onError}
      className={`h-auto ${MEDIA_CLASS}`}
    />
  );
}

function Video({ bloque, onError }) {
  return (
    <video
      controls
      preload="metadata"
      src={bloque.url}
      aria-label={nombreAccesible(bloque)}
      onError={onError}
      className={MEDIA_CLASS}
    />
  );
}

function Audio({ bloque, onError }) {
  return (
    <div className={`p-[var(--space-2)] ${MEDIA_CLASS}`}>
      <audio
        controls
        preload="metadata"
        src={bloque.url}
        aria-label={nombreAccesible(bloque)}
        onError={onError}
        className="block w-full"
      />
    </div>
  );
}

function Documento({ bloque }) {
  return (
    <a
      href={bloque.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[44px] items-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--brand-700)] shadow-[var(--shadow-sm)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-600)]"
    >
      <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex flex-col">
        <span className="font-semibold">
          Abrir documento
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </span>
        <span className="text-[var(--text-secondary)]">
          {nombreAccesible(bloque)}
        </span>
      </span>
    </a>
  );
}

// Registro por tipo: agregar un medio es agregar una entrada.
const MEDIOS = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: Imagen,
  [TIPO_BLOQUE.GIF]: Imagen,
  [TIPO_BLOQUE.VIDEO]: Video,
  [TIPO_BLOQUE.AUDIO]: Audio,
  [TIPO_BLOQUE.DOCUMENTO]: Documento,
});

function AvisoNoDisponible({ textoAlternativo }) {
  return (
    <p className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
      <ImageOff
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="mt-[2px] shrink-0"
      />
      <span className="flex flex-col">
        <span className="text-pretty">{AVISO_NO_DISPONIBLE}</span>
        {textoAlternativo && <span>{textoAlternativo}</span>}
      </span>
    </p>
  );
}

// El backend solo entrega URL https (firmadas o públicas); cualquier otra
// se trata como recurso no disponible.
function esUrlSegura(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

// D7 y D14: sin `url` válida o marcado como no disponible se ve el aviso;
// el resto del nodo sigue visible.
// Un tipo desconocido no se pinta.
export function ChatMediaBlock({ bloque, onError, className = '' }) {
  const Medio = MEDIOS[bloque.tipo];

  if (!Medio) return null;

  return (
    <div className={className}>
      {bloque.noDisponible || !esUrlSegura(bloque.url) ? (
        <AvisoNoDisponible textoAlternativo={bloque.textoAlternativo} />
      ) : (
        <Medio bloque={bloque} onError={onError} />
      )}
    </div>
  );
}
