import { AlertTriangle, GitBranch } from 'lucide-react';

import { ChatAdminNotice } from '../ChatAdminNotice/index.js';

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

const STATUS_STYLES = Object.freeze({
  PUBLICADO:
    'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  BORRADOR:
    'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  ARCHIVADO:
    'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  SIN_CREAR:
    'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
});

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
      <section aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
        <p
          role="status"
          className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]"
        >
          Consultando árboles conversacionales...
        </p>

        <ul
          className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2"
          aria-hidden="true"
        >
          {COMBINATIONS.map(({ dependence, craving }) => (
            <li
              key={`${dependence}-${craving}`}
              className="h-[132px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            />
          ))}
        </ul>
      </section>
    );
  }

  if (error) {
    return (
      <ChatAdminNotice
        tone="danger"
        icon={AlertTriangle}
        title="Árboles no disponibles"
        role="alert"
      >
        No fue posible consultar los árboles conversacionales.
      </ChatAdminNotice>
    );
  }

  if (!Array.isArray(trees)) {
    return (
      <section
        aria-labelledby="personalized-trees-empty-title"
        className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)]"
      >
        <span
          className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          aria-hidden="true"
        >
          <GitBranch size={22} strokeWidth={1.7} />
        </span>

        <h2
          id="personalized-trees-empty-title"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Sin árboles para mostrar
        </h2>

        <p
          role="status"
          className="m-0 max-w-[560px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
        >
          Los árboles estarán disponibles cuando se consulte la información del
          programa.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="personalized-trees-title"
      className="flex flex-col gap-[var(--space-4)]"
    >
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2
          id="personalized-trees-title"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Árboles personalizados
        </h2>

        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Árboles conversacionales organizados por combinación de tipo de
          dependencia y tipo de craving.
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2">
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
              className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <span
                    className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                    aria-hidden="true"
                  >
                    <GitBranch size={20} strokeWidth={1.8} />
                  </span>

                  <h3 className="m-0 min-w-0 pt-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
                    {combination.label}
                  </h3>
                </div>

                <span
                  className={`rounded-[var(--radius-full)] border px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-bold ${
                    STATUS_STYLES[status] ?? STATUS_STYLES.SIN_CREAR
                  }`}
                >
                  <span className="sr-only">Estado: </span>
                  {status.replaceAll('_', ' ')}
                </span>
              </div>

              {tree?.nombre && (
                <p className="m-0 text-[length:var(--font-size-sm)] [overflow-wrap:anywhere] text-[var(--text-secondary)]">
                  {tree.nombre}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-[var(--space-4)] border-t border-[var(--surface-border)] pt-[var(--space-3)] font-[var(--font-mono)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
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
