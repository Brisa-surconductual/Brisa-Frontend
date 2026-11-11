const SHAPE_CLASS = Object.freeze({
  line: 'rounded-[var(--radius-md)]',
  block: 'rounded-[var(--radius-lg)]',
  pill: 'rounded-[var(--radius-full)]',
  circle: 'rounded-[var(--radius-full)]',
});

// Medidas por `style` (D7): un número es px y un texto va tal cual ('45%').
export function Skeleton({ width, height, shape = 'line', className = '' }) {
  const shapeClass = SHAPE_CLASS[shape] ?? SHAPE_CLASS.line;

  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-[var(--surface-hover)] motion-reduce:animate-none ${shapeClass} ${className}`}
      style={{ width, height: shape === 'circle' ? width : height }}
    />
  );
}
