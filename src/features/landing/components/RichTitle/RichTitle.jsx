import { m, useReducedMotion } from 'motion/react';

/**
 * Parte el titular en palabras y espacios, marcando cuáles van en cursiva.
 * Función pura: cada palabra recibe su posición para escalonar la entrada.
 */
function tokenize(parts) {
  const tokens = parts.flatMap((part, partIndex) => {
    const isEm = typeof part !== 'string';
    const text = isEm ? part.em : part;

    return text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((token, tokenIndex) => ({
        key: `${partIndex}-${tokenIndex}`,
        token,
        isEm,
        isSpace: /^\s+$/.test(token),
      }));
  });

  return tokens.map((item, index) => ({
    ...item,
    order: tokens.slice(0, index).filter((prev) => !prev.isSpace).length,
  }));
}

/**
 * Titular con reveal por palabra. `parts` mezcla texto normal y
 * `{ em: '…' }` (cursiva serif). El texto completo queda en el DOM, así que
 * un lector de pantalla lo lee de corrido. Con movimiento reducido no anima.
 *
 * @param {{
 *   parts: readonly (string | { em: string })[],
 *   as?: 'h1' | 'h2' | 'h3',
 *   className?: string,
 *   id?: string,
 * }} props
 */
export function RichTitle({ parts, as: Tag = 'h2', className = '', id }) {
  const reduce = useReducedMotion();

  const nodes = tokenize(parts).map((item) => {
    if (item.isSpace) return item.token;

    const word = (
      <span
        key={item.key}
        className="lp-word"
      >
        <m.span
          className="lp-word__inner"
          initial={reduce ? false : { y: '105%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{
            duration: 0.6,
            delay: item.order * 0.05,
            ease: [0.2, 0.7, 0.2, 1],
          }}
        >
          {item.token}
        </m.span>
      </span>
    );

    return item.isEm ? (
      <em
        key={item.key}
        className="lp-em"
      >
        {word}
      </em>
    ) : (
      word
    );
  });

  return (
    <Tag
      id={id}
      className={`lp-display ${className}`}
    >
      {nodes}
    </Tag>
  );
}
