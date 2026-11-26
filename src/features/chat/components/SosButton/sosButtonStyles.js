// RF-43: apariencia del botón SOS (tokens --sos-* de tokens.css).
export const SOS_BUTTON_HINT_ID = 'sos-boton-ayuda';
export const SOS_BUTTON_HINT =
  'Puedes moverlo arrastrándolo o con las flechas del teclado.';

/*
 * Rojo propio del SOS (tokens --sos-*), distinto del resto de botones.
 * Estados: hover, active (presionado), foco visible y deshabilitado.
 * `touch-none` evita que el navegador desplace la página al arrastrarlo;
 * la transición de left/top anima el ajuste al borde al soltar.
 */
export const SOS_BUTTON_CLASS = [
  'fixed right-[var(--space-4)] bottom-[calc(64px+env(safe-area-inset-bottom)+var(--space-3))] z-30',
  'md:right-[var(--space-6)] md:bottom-[var(--space-6)]',
  'inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-full)]',
  'px-[var(--space-5)] max-[339px]:px-[var(--space-3)]',
  'bg-[var(--sos-bg)] text-[length:var(--font-size-sm)] font-bold text-[var(--sos-text)] shadow-[var(--shadow-lg)]',
  'cursor-grab touch-none select-none',
  'transition-[background-color,left,top,transform] duration-200 motion-reduce:transition-none',
  'enabled:hover:bg-[var(--sos-bg-hover)] enabled:active:bg-[var(--sos-bg-active)] enabled:active:scale-[0.97]',
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--sos-focus-ring)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--sos-bg-disabled)]',
  'data-[arrastrando=true]:cursor-grabbing data-[arrastrando=true]:scale-105 data-[arrastrando=true]:transition-none',
].join(' ');
