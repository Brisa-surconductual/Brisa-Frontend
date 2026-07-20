import { Pencil } from 'lucide-react';

import styles from './ReviewCard.module.css';

export function ReviewCard({
  title,
  rows,
  onEdit = null,
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        {onEdit && (
          <button
            type="button"
            className={styles.editButton}
            onClick={onEdit}
          >
            <Pencil
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>Editar</span>
          </button>
        )}
      </header>

      <dl className={styles.list}>
        {rows.map((row) => (
          <div
            key={row.label}
            className={styles.row}
          >
            <dt className={styles.label}>
              {row.label}
            </dt>

            <dd className={styles.value}>
              {row.value || '—'}

              {row.modified && (
                <span className={styles.modified}>
                  Modificado
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}