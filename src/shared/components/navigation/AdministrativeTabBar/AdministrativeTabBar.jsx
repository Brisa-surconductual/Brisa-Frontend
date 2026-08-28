export function AdministrativeTabBar({
  tabs = [],
  activeTabId,
  onTabChange,
}) {
  return (
    <div className="w-full shrink-0 border-b border-[var(--surface-border)] bg-[var(--surface-card)]">
      <div
        className="mx-auto flex w-full max-w-[1200px] md:px-[var(--space-7)]"
        role="tablist"
        aria-label="Secciones del panel administrativo"
      >
        {tabs.map(({ id, label }) => {
          const isActive =
            id === activeTabId;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              className={`min-w-0 flex-1 border-0 border-b-2 bg-transparent px-[var(--space-2)] py-[var(--space-3)] font-[var(--font-sans)] text-[12px] font-bold transition-[color,background-color] duration-120 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] motion-reduce:transition-none md:flex-[0_1_180px] md:px-[var(--space-5)] md:py-[var(--space-4)] md:text-[13px] ${
                isActive
                  ? 'border-b-[var(--brand-500)] text-[var(--brand-600)]'
                  : 'border-b-transparent text-[var(--text-muted)]'
              }`}
              aria-selected={isActive}
              onClick={() =>
                onTabChange?.(id)
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}