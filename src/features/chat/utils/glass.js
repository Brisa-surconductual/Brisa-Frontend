// Glassmorphism del chat (M03): clases Tailwind literales sobre los
// tokens `--glass-*` de tokens.css, para que todas las piezas nuevas o
// modificadas compartan el mismo vidrio en tema claro y oscuro. Las
// cadenas deben quedar completas (sin concatenar) para que Tailwind las
// detecte al compilar.
export const GLASS = Object.freeze({
  // Superficie translúcida para piezas sin texto largo (avatar, marcos).
  panel:
    'border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-150',
  // Superficie para texto: más opaca, mantiene AA 4.5:1.
  panelTexto:
    'border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-150',
  // Superficie de marca (respuesta del estudiante, opción elegida).
  marca:
    'border border-[var(--glass-brand-border)] bg-[var(--glass-brand-bg)] text-[var(--glass-brand-text)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]',
  // Fondo de la pantalla del chat.
  fondo: '[background:var(--chat-backdrop)]',
});
