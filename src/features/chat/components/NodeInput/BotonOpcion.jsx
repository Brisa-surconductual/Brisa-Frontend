import { GLASS } from '../../utils/glass.js';

// type="button": dentro del <form>, tocar una opción no debe enviarlo.
export function BotonOpcion({ elegida, children, ...props }) {
  // La elegida brilla con la marca y además lleva ícono (lo pone quien
  // usa el botón): el color nunca es la única señal.
  const estado = elegida
    ? `${GLASS.marca} shadow-[var(--glass-glow)]`
    : `${GLASS.panelTexto} text-[var(--text-primary)] enabled:hover:border-[var(--brand-400)] enabled:hover:shadow-[var(--glass-glow)]`;

  return (
    <button
      type="button"
      {...props}
      className={`flex min-h-[44px] w-full items-center gap-[var(--space-2)] rounded-[var(--radius-xl)] px-[var(--space-4)] py-[var(--space-2)] text-left text-[13px] font-semibold transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-45 ${estado}`}
    >
      {children}
    </button>
  );
}
