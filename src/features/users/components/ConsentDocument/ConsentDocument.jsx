import styles from './ConsentDocument.module.css';

export const CONSENT_VERSION = '2026-06';

export function ConsentDocument() {
  return (
    <article
      className={styles.document}
      aria-labelledby="consent-document-title"
    >
      <header className={styles.header}>
        <div>
          <h2
            id="consent-document-title"
            className={styles.title}
          >
            Consentimiento informado
          </h2>

          <p className={styles.version}>
            Versión {CONSENT_VERSION}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <p>
          Le invitamos a participar de manera voluntaria.
          Antes de decidir, lea atentamente la siguiente
          información:
        </p>

        <ul>
          <li>
            La aplicación de las pruebas tiene fines{' '}
            <strong>
              académicos, formativos y de investigación
            </strong>
            , según los objetivos del proyecto institucional.
          </li>

          <li>
            Sus respuestas y resultados serán manejados con{' '}
            <strong>estricta confidencialidad</strong>,
            siguiendo los lineamientos éticos y legales
            vigentes.
          </li>

          <li>
            Su participación es <strong>voluntaria</strong>;
            puede retirarse en cualquier momento, sin que
            ello genere consecuencias negativas para usted.
          </li>

          <li>
            La información recolectada será utilizada
            exclusivamente con propósitos pedagógicos y de
            investigación, de forma{' '}
            <strong>agregada y sin identificar</strong> a los
            participantes.
          </li>

          <li>
            Si tiene dudas o requiere información adicional,
            puede comunicarse con el equipo responsable del
            proyecto.
          </li>
        </ul>

        <p className={styles.closing}>
          Al continuar, usted declara que ha comprendido la
          información anterior y otorga su consentimiento para
          participar de manera libre y voluntaria.
        </p>
      </div>
    </article>
  );
}