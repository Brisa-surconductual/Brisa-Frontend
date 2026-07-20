import { useState } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { confirmRegistration } from '../../api/registrationApi.js';
import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { ReviewCard } from '../../components/ReviewCard/index.js';
import { useRegistration } from '../../hooks/useRegistration.js';
import {
  getModifiedFieldLabels,
  getSensitiveModifiedFields,
} from '../../services/registrationReview.js';

import {
  formatAcademicLevel,
  formatConsumptionFrequency,
  formatConsumptionReason,
  formatDate,
} from '../../utils/registrationFormatters.js';

import styles from './ReviewPage.module.css';

export function ReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    account,
    consent,
    baseline,
    modifiedFields,
    saveAccount,
    startReviewEdit,
  } = useRegistration();

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  if (!account) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  if (!consent) {
    return (
      <Navigate
        to="/registro/consentimiento"
        replace
      />
    );
  }

  if (!baseline) {
    return (
      <Navigate
        to="/registro/linea-base"
        replace
      />
    );
  }

  const consentIsValid =
    consent.status === 'VIGENTE';

  const sensitiveModifiedFields =
    getSensitiveModifiedFields(modifiedFields);

  const sensitiveModifiedLabels =
    getModifiedFieldLabels(
      sensitiveModifiedFields,
    );

  function fieldWasModified(field) {
    return modifiedFields.includes(field);
  }

  function editSection(section) {
    startReviewEdit(section);
    navigate('/registro/linea-base');
  }

  async function handleConfirmation() {
    if (!consentIsValid) {
      navigate('/registro/reconsentimiento');

      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const completedAccount =
        await confirmRegistration({
          userId: account.userId,
        });

      saveAccount({
        ...account,
        ...completedAccount,
      });

      navigate('/registro/completado', {
        replace: true,
      });
    } catch (error) {
      if (error.code === 'CONSENT_NOT_VALID') {
        navigate('/registro/reconsentimiento');

        return;
      }

      setSubmitError(
        'No pudimos confirmar el registro. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const accountRows = [
    {
      label: 'Correo electrónico',
      value: account.email,
    },
  ];

  const academicRows = [
    {
      field: 'age',
      label: 'Edad',
      value: `${baseline.age} años`,
    },
    {
      field: 'city',
      label: 'Ciudad',
      value: baseline.city,
    },
    {
      field: 'educationalInstitution',
      label: 'Entidad educativa',
      value: baseline.educationalInstitution,
    },
    {
      field: 'academicProgram',
      label: 'Programa académico',
      value: baseline.academicProgram,
    },
    {
      field: 'semester',
      label: 'Semestre cursado',
      value: baseline.semester,
    },
    {
      field: 'academicLevel',
      label: 'Nivel académico',
      value: formatAcademicLevel(
        baseline.academicLevel,
      ),
    },
  ].map((row) => ({
    ...row,
    modified: fieldWasModified(row.field),
  }));

  const consumptionRows = [
    {
      field: 'consumptionStartDate',
      label: 'Inicio de consumo',
      value: formatDate(
        baseline.consumptionStartDate,
      ),
    },
    {
      field: 'lastConsumptionDate',
      label: 'Último consumo',
      value: formatDate(
        baseline.lastConsumptionDate,
      ),
    },
    {
      field: 'consumptionReason',
      label: 'Motivo principal',
      value: formatConsumptionReason(
        baseline.consumptionReason,
      ),
    },
    {
      field: 'consumptionFrequency',
      label: 'Frecuencia aproximada',
      value: formatConsumptionFrequency(
        baseline.consumptionFrequency,
      ),
    },
  ].map((row) => ({
    ...row,
    modified: fieldWasModified(row.field),
  }));

  /*
   * Evita advertencias de variables no utilizadas y documenta
   * qué campos pertenecen a cada sección.
   */

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() =>
            navigate('/registro/linea-base')
          }
          aria-label="Volver a línea base"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Revisión
        </span>
      </header>

      <RegistrationStepper currentStep={4} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 4 de 4
        </span>

        <h1 className={styles.title}>
          Revisa antes de confirmar
        </h1>

        <p className={styles.description}>
          Verifica que la información sea correcta.
          Puedes editar las secciones habilitadas antes
          de finalizar.
        </p>
      </section>

      {location.state?.consentRenewed && (
        <div
          className={styles.successAlert}
          role="status"
        >
          <CheckCircle2
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              Consentimiento actualizado
            </strong>

            <p>
              Ya puedes confirmar el registro.
            </p>
          </div>
        </div>
      )}

      {!consentIsValid && (
        <div
          className={styles.warningAlert}
          role="alert"
        >
          <ShieldAlert
            size={21}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              Debes aceptar nuevamente el consentimiento
            </strong>

            <p>
              Modificaste información sensible:
              {' '}
              {sensitiveModifiedLabels.join(', ')}.
            </p>

            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() =>
                navigate(
                  '/registro/reconsentimiento',
                )
              }
            >
              Actualizar consentimiento
            </Button>
          </div>
        </div>
      )}

      {modifiedFields.length > 0 &&
        consentIsValid && (
          <div className={styles.infoAlert}>
            <Info
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <div>
              <strong>
                Cambios guardados
              </strong>

              <p>
                Los campos modificados están identificados
                en las tarjetas de revisión.
              </p>
            </div>
          </div>
        )}

      {submitError && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              No pudimos finalizar el registro
            </strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <div className={styles.cards}>
        <ReviewCard
          title="Cuenta"
          rows={accountRows}
        />

        <ReviewCard
          title="Datos académicos"
          rows={academicRows}
          onEdit={() => editSection('academic')}
        />

        <ReviewCard
          title="Datos de consumo"
          rows={consumptionRows}
          onEdit={() => editSection('consumption')}
        />
      </div>

      <div className={styles.privacyNote}>
        La contraseña no se muestra ni puede consultarse
        desde esta pantalla.
      </div>

      <Button
        type="button"
        size="large"
        fullWidth
        loading={isSubmitting}
        loadingText="Confirmando registro..."
        onClick={handleConfirmation}
      >
        {consentIsValid
          ? 'Confirmar y finalizar registro'
          : 'Revisar consentimiento'}
      </Button>
    </div>
  );
}