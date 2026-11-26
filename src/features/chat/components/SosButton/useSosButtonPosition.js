import { useEffect, useRef, useState } from 'react';

import {
  aCoordenadas,
  ajustarABorde,
  calcularLimites,
  iniciarGesto,
  moverConTeclado,
  moverGesto,
  posicionRecordada,
  recordarPosicion,
  terminarGesto,
} from './posicionSosButton.js';

// El layout del estudiante marca qué no debe tapar el botón.
export const LIMITE_SUPERIOR_SOS = 'superior';
export const LIMITE_INFERIOR_SOS = 'inferior';

const cssAreasSeguras =
  'position:fixed;visibility:hidden;pointer-events:none;' +
  'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) ' +
  'env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';

// `env(safe-area-inset-*)` no se puede leer desde JS: se mide con una
// sonda invisible que lo usa como relleno.
function leerAreasSeguras() {
  const sonda = document.createElement('div');
  sonda.style.cssText = cssAreasSeguras;
  document.body.appendChild(sonda);
  const estilo = getComputedStyle(sonda);
  const areas = {
    superior: Number.parseFloat(estilo.paddingTop) || 0,
    derecha: Number.parseFloat(estilo.paddingRight) || 0,
    inferior: Number.parseFloat(estilo.paddingBottom) || 0,
    izquierda: Number.parseFloat(estilo.paddingLeft) || 0,
  };
  sonda.remove();
  return areas;
}

const rectVisible = (selector) => {
  const rect = document
    .querySelector(`[data-sos-limite="${selector}"]`)
    ?.getBoundingClientRect();
  return rect && rect.height > 0 ? rect : null;
};

// Límites reales: encabezado arriba, barra inferior (solo en móvil) abajo
// y las áreas seguras del dispositivo.
function medirLimites(boton) {
  if (!boton) return null;

  const rect = boton.getBoundingClientRect();
  const seguras = leerAreasSeguras();
  const altoVentana = window.innerHeight;
  const encabezado = rectVisible(LIMITE_SUPERIOR_SOS);
  const barra = rectVisible(LIMITE_INFERIOR_SOS);
  const fondo = altoVentana - seguras.inferior;

  return calcularLimites({
    anchoVentana: document.documentElement.clientWidth || window.innerWidth,
    altoVentana,
    anchoBoton: rect.width,
    altoBoton: rect.height,
    superior: Math.max(seguras.superior, encabezado ? encabezado.bottom : 0),
    inferior: barra ? Math.min(barra.top, fondo) : fondo,
    seguras,
  });
}

/*
 * RF-43: posición del botón SOS. Sin arrastrar, el botón queda en su sitio
 * por CSS (abajo a la derecha). Tras moverlo, se pinta en coordenadas
 * fijas calculadas con los límites medidos.
 */
export function useSosButtonPosition({ visible }) {
  const botonRef = useRef(null);
  const gestoRef = useRef(null);
  const limitesRef = useRef(null);
  // El `click` que sigue a un arrastre no activa el SOS.
  const suprimirClickRef = useRef(false);
  const [coordenadas, setCoordenadas] = useState(null);
  const [arrastre, setArrastre] = useState(null);

  function fijar(posicion, limites) {
    recordarPosicion(posicion);
    setCoordenadas(aCoordenadas(posicion, limites));
  }

  // Al mostrarse (también al volver de la pantalla SOS) y al cambiar el
  // tamaño u orientación de la pantalla, se vuelve a limitar la posición.
  useEffect(() => {
    if (!visible) return undefined;

    const recalcular = () => {
      const posicion = posicionRecordada();
      const limites = posicion ? medirLimites(botonRef.current) : null;

      setCoordenadas(
        posicion && limites ? aCoordenadas(posicion, limites) : null,
      );
    };
    const cuadro = requestAnimationFrame(recalcular);

    window.addEventListener('resize', recalcular);
    window.addEventListener('orientationchange', recalcular);
    window.visualViewport?.addEventListener('resize', recalcular);

    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('resize', recalcular);
      window.removeEventListener('orientationchange', recalcular);
      window.visualViewport?.removeEventListener('resize', recalcular);
    };
  }, [visible]);

  function onPointerDown(evento) {
    suprimirClickRef.current = false;
    // Solo el botón principal del mouse; dedo y lápiz siempre.
    if (evento.pointerType === 'mouse' && evento.button !== 0) return;

    const boton = botonRef.current;
    const limites = medirLimites(boton);

    if (!limites) return;

    const rect = boton.getBoundingClientRect();

    limitesRef.current = limites;
    gestoRef.current = iniciarGesto(evento, { x: rect.left, y: rect.top });
    boton.setPointerCapture?.(evento.pointerId);
  }

  function onPointerMove(evento) {
    if (!gestoRef.current) return;

    const gesto = moverGesto(gestoRef.current, evento, limitesRef.current);

    gestoRef.current = gesto;
    if (gesto.arrastrando) {
      evento.preventDefault();
      setArrastre(gesto.punto);
    }
  }

  function terminar(evento) {
    const gesto = gestoRef.current;

    if (!gesto) return;

    gestoRef.current = null;
    if (botonRef.current?.hasPointerCapture?.(evento.pointerId)) {
      botonRef.current.releasePointerCapture(evento.pointerId);
    }

    const { posicion, suprimirClick } = terminarGesto(
      gesto,
      limitesRef.current,
    );

    setArrastre(null);
    suprimirClickRef.current = suprimirClick;
    if (posicion) fijar(posicion, limitesRef.current);
  }

  // Flechas para mover; Enter y Espacio siguen activando (no se tocan).
  function onKeyDown(evento) {
    suprimirClickRef.current = false;

    const boton = botonRef.current;
    const limites = medirLimites(boton);

    if (!limites) return;

    const rect = boton.getBoundingClientRect();
    const actual =
      posicionRecordada() ??
      ajustarABorde({ x: rect.left, y: rect.top }, limites);
    const nueva = moverConTeclado(actual, evento, limites);

    if (!nueva) return;

    evento.preventDefault();
    fijar(nueva, limites);
  }

  // true si el `click` recibido viene de un arrastre y debe ignorarse.
  function consumirClickDeArrastre() {
    const suprimir = suprimirClickRef.current;

    suprimirClickRef.current = false;
    return suprimir;
  }

  const punto = arrastre ?? coordenadas;

  return {
    botonRef,
    arrastrando: arrastre !== null,
    estilo: punto
      ? {
          left: `${punto.x}px`,
          top: `${punto.y}px`,
          right: 'auto',
          bottom: 'auto',
        }
      : undefined,
    manejadores: {
      onPointerDown,
      onPointerMove,
      onPointerUp: terminar,
      onPointerCancel: terminar,
      onKeyDown,
    },
    consumirClickDeArrastre,
  };
}
