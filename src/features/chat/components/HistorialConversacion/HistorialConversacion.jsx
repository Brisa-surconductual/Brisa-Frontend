import { useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react';

import { ChatThread } from '../ChatThread/index.js';
import { LoadEarlierButton } from '../LoadEarlierButton/index.js';

import {
  ajusteTrasAnteponer,
  bordeSuperior,
  contenedorDeScroll,
  debeCargarAnteriores,
} from './desplazamiento.js';

const primerMensaje = (raiz) =>
  raiz?.querySelector('[role="log"]')?.firstElementChild ?? null;

function desplazar(contenedor, delta) {
  if (!contenedor || delta === 0) return;

  if (
    contenedor === document.scrollingElement ||
    contenedor === document.documentElement
  ) {
    window.scrollBy(0, delta);
  } else {
    contenedor.scrollTop += delta;
  }
}

/*
 * RF-31: historial de la conversación. Pinta el hilo (ChatThread) y, si
 * hay interacciones anteriores, las pide al desplazarse hacia arriba
 * cerca del inicio. El botón «Ver mensajes anteriores» (RF-32) sigue
 * visible: es la alternativa para teclado y lector de pantalla, y la vía
 * de reintento tras un error.
 *
 * Al anteponer una página, lo que se estaba leyendo no salta: se mide el
 * primer mensaje antes de la carga y se compensa lo que bajó.
 */
export function HistorialConversacion({
  items,
  hayMas,
  inicioAlcanzado = false,
  cargandoAnteriores,
  errorAnteriores,
  onCargarAnteriores,
  onRecursoError,
  ultimoRef,
}) {
  const raizRef = useRef(null);
  // { elemento, top, idPrimero }: el primer mensaje antes de la carga.
  const anclaRef = useRef(null);
  const idPrimero = items[0]?.id;

  function cargar() {
    const elemento = primerMensaje(raizRef.current);

    anclaRef.current = elemento
      ? { elemento, top: elemento.getBoundingClientRect().top, idPrimero }
      : null;
    onCargarAnteriores();
  }

  // Con la página ya en el DOM y antes de pintar, se compensa el salto.
  useLayoutEffect(() => {
    const ancla = anclaRef.current;
    if (!ancla || cargandoAnteriores) return;

    anclaRef.current = null;
    if (ancla.idPrimero === idPrimero || !ancla.elemento.isConnected) return;

    desplazar(
      contenedorDeScroll(raizRef.current),
      ajusteTrasAnteponer(
        ancla.top,
        ancla.elemento.getBoundingClientRect().top,
      ),
    );
  }, [idPrimero, cargandoAnteriores]);

  const alDesplazar = useEffectEvent((contenedor, subiendo) => {
    // Si la estudiante sigue moviéndose durante la carga, la referencia
    // se actualiza para no devolverla a donde estaba.
    if (anclaRef.current?.elemento.isConnected) {
      anclaRef.current.top =
        anclaRef.current.elemento.getBoundingClientRect().top;
    }

    const raiz = raizRef.current;
    if (!raiz) return;

    const distanciaAlInicio =
      raiz.getBoundingClientRect().top - bordeSuperior(contenedor);

    if (
      debeCargarAnteriores({
        subiendo,
        distanciaAlInicio,
        hayMas,
        cargando: cargandoAnteriores,
        conError: Boolean(errorAnteriores),
      })
    ) {
      cargar();
    }
  });

  useEffect(() => {
    if (!hayMas) return undefined;

    const contenedor = contenedorDeScroll(raizRef.current);
    if (!contenedor) return undefined;

    const esDocumento =
      contenedor === document.scrollingElement ||
      contenedor === document.documentElement;
    const objetivo = esDocumento ? window : contenedor;
    const posicion = () =>
      esDocumento ? window.scrollY : contenedor.scrollTop;
    let previa = posicion();

    function alMover() {
      const actual = posicion();
      const subiendo = actual < previa;
      previa = actual;
      alDesplazar(contenedor, subiendo);
    }

    objetivo.addEventListener('scroll', alMover, { passive: true });
    return () => objetivo.removeEventListener('scroll', alMover);
  }, [hayMas]);

  return (
    <div ref={raizRef} className="flex flex-col gap-[var(--space-3)]">
      {hayMas && (
        <LoadEarlierButton
          cargando={cargandoAnteriores}
          error={errorAnteriores}
          onCargar={cargar}
        />
      )}

      {!hayMas && inicioAlcanzado && items.length > 0 && (
        <p className="m-0 text-center text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          Inicio de la conversación
        </p>
      )}

      {items.length > 0 && (
        <ChatThread
          items={items}
          onRecursoError={onRecursoError}
          ultimoRef={ultimoRef}
        />
      )}
    </div>
  );
}
