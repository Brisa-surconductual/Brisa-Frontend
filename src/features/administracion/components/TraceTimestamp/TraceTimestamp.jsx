import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

/*
 * Marca temporal del backend en hora de Colombia, dentro de <time>. Una
 * marca sin zona horaria o inválida no se interpreta: se indica como no
 * disponible.
 */
export function TraceTimestamp({ value }) {
  const label = formatAuditTimestamp(value);

  if (!label) return <span>Fecha no disponible</span>;

  return (
    <>
      <time dateTime={value}>{label}</time>
      <span className="sr-only"> (hora de Colombia)</span>
    </>
  );
}
