import { m, useReducedMotion } from 'motion/react';

/**
 * Entrada suave (opacidad + desplazamiento) al entrar en el viewport.
 * Solo anima transform y opacity. Sin efecto con movimiento reducido.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  y = 24,
  className = '',
  children,
  ...rest
}) {
  const reduce = useReducedMotion();
  const Component = m[as] ?? m.div;

  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
}
