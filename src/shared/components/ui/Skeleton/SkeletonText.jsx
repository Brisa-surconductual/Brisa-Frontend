import { Skeleton } from './Skeleton.jsx';

export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  lastLineWidth = '60%',
}) {
  return (
    <span aria-hidden="true" className="flex flex-col gap-[var(--space-2)]">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
        />
      ))}
    </span>
  );
}
