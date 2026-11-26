import { useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Tarjeta de vidrio con tilt 3D suave y un resplandor que sigue al cursor.
 * Escribe variables CSS (--rx, --ry, --gx, --gy); el CSS solo mueve
 * `transform` y `opacity`. Sin efecto con movimiento reducido o táctil.
 */
export function GlassCard({
  as: Tag = 'div',
  tilt = true,
  className = '',
  children,
  ...rest
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);

  function handleMove(event) {
    const element = ref.current;

    if (reduce || !tilt || !element || event.pointerType !== 'mouse') return;

    const box = element.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;

    element.style.setProperty('--rx', `${((x / box.width - 0.5) * 8).toFixed(2)}deg`);
    element.style.setProperty('--ry', `${((0.5 - y / box.height) * 8).toFixed(2)}deg`);
    element.style.setProperty('--gx', `${(x - 120).toFixed(0)}px`);
    element.style.setProperty('--gy', `${(y - 120).toFixed(0)}px`);
  }

  function handleLeave() {
    const element = ref.current;

    if (!element) return;
    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
  }

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`lp-glass lp-tilt ${className}`}
      {...rest}
    >
      <span
        className="lp-glow"
        aria-hidden="true"
      />
      {children}
    </Tag>
  );
}
