const COMBINATIONS = [
  {
    dependence: 'ABSTINENCIA_FISICA',
    craving: 'POSITIVO',
    label: 'Abstinencia física · Craving positivo',
  },
  {
    dependence: 'ABSTINENCIA_FISICA',
    craving: 'NEGATIVO',
    label: 'Abstinencia física · Craving negativo',
  },
  {
    dependence: 'TOLERANCIA',
    craving: 'POSITIVO',
    label: 'Tolerancia · Craving positivo',
  },
  {
    dependence: 'TOLERANCIA',
    craving: 'NEGATIVO',
    label: 'Tolerancia · Craving negativo',
  },
];

const STATUS_STYLES = {
  PUBLICADO: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  BORRADOR: 'bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  ARCHIVADO: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  SIN_CREAR: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
};

function findLatestTree(trees, combination) {
  return trees
    .filter(
      (tree) =>
        tree.modalidad?.toUpperCase() === 'PERSONALIZADA' &&
        tree.tipo_dependencia?.toUpperCase() === combination.dependence &&
        tree.tipo_craving?.toUpperCase() === combination.craving,
    )
    .reduce(
      (latest, tree) =>
        !latest || Number(tree.version) > Number(latest.version)
          ? tree
          : latest,
      null,
    );
}

export function PersonalizedTreesList({
  trees = null,
  isLoading = false,
  error = null,
}) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-[var(--text-secondary)]">
        Consultando árboles conversacionales...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-[var(--danger-text)]">
        No fue posible consultar los árboles conversacionales.
      </p>
    );
  }

  if (!Array.isArray(trees)) {
    return (
      <p role="status" className="text-sm text-[var(--text-muted)]">
        Los árboles estarán disponibles cuando se consulte la información del
        programa.
      </p>
    );
  }

  return (
    <section aria-labelledby="personalized-trees-title">
      <h2
        id="personalized-trees-title"
        className="mb-[var(--space-2)] text-xl font-extrabold text-[var(--text-primary)]"
      >
        Árboles personalizados
      </h2>

      <p className="mb-[var(--space-5)] text-sm text-[var(--text-secondary)]">
        Árboles conversacionales organizados por combinación de tipo de
        dependencia y tipo de craving.
      </p>

      <ul className="grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2">
        {COMBINATIONS.map((combination) => {
          const tree = findLatestTree(trees, combination);
          const status = tree
            ? (tree.estado?.toUpperCase() ?? 'SIN_CREAR')
            : 'SIN_CREAR';

          const nodeCount = Array.isArray(tree?.nodos)
            ? tree.nodos.length
            : null;

          return (
            <li
              key={`${combination.dependence}-${combination.craving}`}
              className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
                <h3 className="m-0 flex-1 text-sm font-bold text-[var(--text-primary)]">
                  {combination.label}
                </h3>

                <span
                  className={`rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-1)] text-xs font-bold ${
                    STATUS_STYLES[status] ?? STATUS_STYLES.SIN_CREAR
                  }`}
                >
                  {status.replaceAll('_', ' ')}
                </span>
              </div>

              {tree?.nombre && (
                <p className="mt-[var(--space-3)] text-sm text-[var(--text-secondary)]">
                  {tree.nombre}
                </p>
              )}

              <div className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-4)] text-xs text-[var(--text-muted)]">
                <span>
                  {tree ? `Versión ${tree.version}` : 'Sin versiones'}
                </span>

                {nodeCount !== null && <span>{nodeCount} nodos</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
