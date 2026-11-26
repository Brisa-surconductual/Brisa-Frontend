import { AdministrativePauseCard } from '@/features/cronograma/components/AdministrativePauseCard/index.js';

export function AdministrativePauseList({ pauses, onAnnul, disabled = false }) {
  return (
    <ul className="m-0 grid list-none gap-[var(--space-4)] p-0 lg:grid-cols-2">
      {pauses.map((pause) => (
        <li key={pause.idPausaAdministrativa}>
          <AdministrativePauseCard
            pause={pause}
            disabled={disabled}
            onAnnul={() => onAnnul?.(pause)}
          />
        </li>
      ))}
    </ul>
  );
}
