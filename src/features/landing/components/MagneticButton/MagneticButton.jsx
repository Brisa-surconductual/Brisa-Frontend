import { useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Botón o enlace con efecto magnético (solo con mouse y sin movimiento
 * reducido). Es polimórfico: `as={Link}` + `to`, `as="a"` + `href` o botón.
 *
 * @param {{
 *   as?: any,
 *   variant?: 'primary' | 'glass' | 'ghost' | 'dark',
 *   strength?: number,
 *   className?: string,
 * }} props
 */
export function MagneticButton({
  as: Tag = 'button',
  variant = 'primary',
  strength = 0.22,
  className = '',
  children,
  ...rest
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);

  function handleMove(event) {
    const element = ref.current;

    if (reduce || !element || event.pointerType !== 'mouse') return;

    const box = element.getBoundingClientRect();
    const dx = (event.clientX - box.left - box.width / 2) * strength;
    const dy = (event.clientY - box.top - box.height / 2) * strength;

    element.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }

  function handleLeave() {
    if (ref.current) ref.current.style.transform = '';
  }

  const extra = Tag === 'button' && !rest.type ? { type: 'button' } : {};

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`lp-btn lp-btn--${variant} ${className}`}
      {...extra}
      {...rest}
    >
      {children}
    </Tag>
  );
}
