import { useEffect, useRef } from 'react';

/**
 * Parallax con el puntero: escribe --px y --py (de -0.5 a 0.5) en el
 * elemento. Las capas solo aplican `transform` con esas variables, así que
 * no hay re-render de React ni layout.
 * @param {boolean} enabled
 */
export function usePointerParallax(enabled) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;

    if (!enabled || !element) return;

    let frame = 0;

    function handleMove(event) {
      if (event.pointerType === 'touch' || frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;

        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;

        element.style.setProperty('--px', x.toFixed(3));
        element.style.setProperty('--py', y.toFixed(3));
      });
    }

    element.addEventListener('pointermove', handleMove);

    return () => {
      element.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return ref;
}
