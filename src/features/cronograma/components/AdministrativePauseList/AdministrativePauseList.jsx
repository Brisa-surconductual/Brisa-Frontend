import { AdministrativePauseCard } from '@/features/cronograma/components/AdministrativePauseCard/index.js';

export function AdministrativePauseList({ pauses, onAnnul }) {
  return (
    <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
      {pauses.map((pause) => (
        <AdministrativePauseCard
          key={pause.idPausaAdministrativa} // Llave real del backend
          pause={pause} // Le pasamos todo el objeto directo
          onAnnul={() => onAnnul?.(pause)}
        />
      ))}
    </div>
  );
}