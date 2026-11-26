import { useInView } from '../../hooks/useInView.js';

/**
 * Sección de la landing. Marca `data-active` según esté en el viewport para
 * que el CSS pause las animaciones infinitas fuera de pantalla.
 *
 * @param {{ id?: string, tone?: 'dark' | 'light', labelledBy?: string }} props
 */
export function Section({
  id,
  tone = 'dark',
  labelledBy,
  arc = true,
  className = '',
  children,
}) {
  const [ref, inView] = useInView({ rootMargin: '120px 0px', threshold: 0 });

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      data-active={inView}
      className={`lp-section lp-${tone} ${arc ? 'lp-arc' : ''} ${className}`}
    >
      {children}
    </section>
  );
}
