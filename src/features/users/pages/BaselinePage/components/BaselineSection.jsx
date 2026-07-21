import styles from './BaselineSection.module.css';

export function BaselineSection({
  id,
  icon,
  title,
  description,
  children,
}) {
  return (
    <fieldset
      id={id}
      className={styles.section}
    >
      <legend className={styles.header}>
        <span
          className={styles.icon}
          aria-hidden="true"
        >
          {icon}
        </span>

        <span className={styles.heading}>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
      </legend>

      {children}
    </fieldset>
  );
}