import { CircleAlert, FileText, ImageOff, VideoOff } from 'lucide-react';

import { useRecursoMultimedia } from '../../hooks/useRecursoMultimedia.js';
import { esUrlSegura } from '../../services/multimedia.js';
import {
  AVISO_MULTIMEDIA,
  ESTADO_RENDER,
  TIPO_BLOQUE,
} from '../../types/index.js';

const { ERROR_CARGA, NO_SOPORTADO } = ESTADO_RENDER;

// RF-33 v1.1: todo recurso caído, también AUDIO y DOCUMENTO, usa el texto
// de fallo de carga (enmienda D16, reemplaza el texto de D15).
const AVISO_FALLO_CARGA = AVISO_MULTIMEDIA[ERROR_CARGA];

const AVISO_POR_ESTADO = Object.freeze({
  [ERROR_CARGA]: AVISO_FALLO_CARGA,
  [NO_SOPORTADO]: AVISO_MULTIMEDIA[NO_SOPORTADO],
});

const ICONO_AVISO = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: ImageOff,
  [TIPO_BLOQUE.GIF]: ImageOff,
  [TIPO_BLOQUE.VIDEO]: VideoOff,
});

// D18 de FE-M03-03: sin `textoAlternativo`, el nombre accesible es el
// del tipo.
const NOMBRE_POR_TIPO = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: 'Imagen',
  [TIPO_BLOQUE.GIF]: 'Imagen animada',
  [TIPO_BLOQUE.VIDEO]: 'Video',
  [TIPO_BLOQUE.AUDIO]: 'Audio',
  [TIPO_BLOQUE.DOCUMENTO]: 'Documento',
});

const nombreAccesible = (bloque) =>
  bloque.textoAlternativo || NOMBRE_POR_TIPO[bloque.tipo];

const MEDIA_CLASS =
  'block w-full rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]';

// D9: en carga, la imagen sigue montada (el navegador la descarga) pero
// invisible e inerte para lectores y foco, con la altura reservada porque
// el DTO no trae dimensiones.
function Imagen({ bloque, src, cargando, onLoad, onError }) {
  return (
    <img
      src={src}
      alt={nombreAccesible(bloque)}
      loading="lazy"
      inert={cargando}
      onLoad={onLoad}
      onError={onError}
      className={`${MEDIA_CLASS} ${cargando ? 'aspect-[4/3] object-cover opacity-0' : 'h-auto'}`}
    />
  );
}

// D10: sin autoplay; solo metadatos hasta que la estudiante lo inicia.
// Enmienda D14: siempre visible, porque en iOS `loadedmetadata` puede no
// llegar hasta que se toca el video. Su fallo sigue la recarga de A-017.
function Video({ bloque, src, onError }) {
  return (
    <video
      controls
      preload="metadata"
      src={src}
      aria-label={nombreAccesible(bloque)}
      onError={onError}
      className={`aspect-video ${MEDIA_CLASS}`}
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

function Aviso({ texto, tipo, textoAlternativo }) {
  const Icono = ICONO_AVISO[tipo] ?? CircleAlert;

  return (
    <p
      role="status"
      className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
    >
      <Icono
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="mt-[2px] shrink-0"
      />
      <span className="flex flex-col">
        <span className="text-pretty">{texto}</span>
        {textoAlternativo && <span>{textoAlternativo}</span>}
      </span>
    </p>
  );
}

// RF-33: imagen, GIF y video con estado de render.
function MedioVisual({ bloque, Medio, onError }) {
  const recurso = useRecursoMultimedia(bloque, onError);
  const aviso = AVISO_POR_ESTADO[recurso.estado];

  if (aviso) {
    return (
      <Aviso
        texto={aviso}
        tipo={bloque.tipo}
        textoAlternativo={bloque.textoAlternativo}
      />
    );
  }

  // Enmienda D14: el video no muestra marcador de carga.
  const cargando =
    recurso.estado === ESTADO_RENDER.CARGANDO &&
    bloque.tipo !== TIPO_BLOQUE.VIDEO;

  return (
    <div aria-busy={cargando} className="relative">
      {cargando && (
        <>
          <span role="status" className="sr-only">
            Cargando imagen
          </span>
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-hover)] motion-reduce:animate-none"
          />
        </>
      )}
      <Medio
        bloque={bloque}
        src={recurso.src}
        cargando={cargando}
        onLoad={recurso.onLoad}
        onError={recurso.onError}
      />
    </div>
  );
}

const VISUALES = Object.freeze({
  [TIPO_BLOQUE.IMAGEN]: Imagen,
  [TIPO_BLOQUE.GIF]: Imagen,
  [TIPO_BLOQUE.VIDEO]: Video,
});

// AUDIO y DOCUMENTO siguen como en RF-26, salvo el texto del aviso
// (enmiendas D15 y D16 de FE-M03-05).
const OTROS = Object.freeze({
  [TIPO_BLOQUE.AUDIO]: Audio,
  [TIPO_BLOQUE.DOCUMENTO]: Documento,
});

// D7 y D14 de FE-M03-03: sin `url` válida o marcado como no disponible se
// ve el aviso; el resto del nodo sigue visible. Un tipo desconocido no se
// pinta.
export function ChatMediaBlock({ bloque, onError, className = '' }) {
  const Visual = VISUALES[bloque.tipo];
  const Otro = OTROS[bloque.tipo];

  if (Visual) {
    return (
      <div className={className}>
        <MedioVisual bloque={bloque} Medio={Visual} onError={onError} />
      </div>
    );
  }

  if (!Otro) return null;

  return (
    <div className={className}>
      {bloque.noDisponible || !esUrlSegura(bloque.url) ? (
        <Aviso
          texto={AVISO_FALLO_CARGA}
          tipo={bloque.tipo}
          textoAlternativo={bloque.textoAlternativo}
        />
      ) : (
        <Otro bloque={bloque} onError={onError} />
      )}
    </div>
  );
}
