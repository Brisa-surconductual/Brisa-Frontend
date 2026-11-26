export function SkeletonCard({ height, children, className = '' }) {
  const pulse = children
    ? ''
    : 'animate-pulse motion-reduce:animate-none';

  return (
    <div
      aria-hidden="true"
      className={`rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] ${pulse} ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
}
