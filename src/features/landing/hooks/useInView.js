import { useEffect, useRef, useState } from 'react';

/**
 * Observa si un elemento está en el viewport. Sirve para pausar animaciones
 * fuera de pantalla y para disparar entradas una sola vez.
 * Sin IntersectionObserver (render de servidor) se considera visible.
 * @param {{ once?: boolean, rootMargin?: string, threshold?: number }} [options]
 * @returns {[import('react').RefObject<any>, boolean]}
 */
export function useInView({
  once = false,
  rootMargin = '0px',
  threshold = 0.15,
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) observer.disconnect();
      },
      { rootMargin, threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return [ref, inView];
}
