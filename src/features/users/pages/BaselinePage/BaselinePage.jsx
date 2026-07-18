import {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  MapPin,
} from 'lucide-react';


import { Button } from '../../../../shared/components/ui/Button/index.js';
import { SelectField } from '../../../../shared/components/ui/SelectField/index.js';
import { TextField } from '../../../../shared/components/ui/TextField/index.js';

import {
  saveBaselineData,
  updateRegistrationData,
} from '../../api/registrationApi.js';
import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { useRegistration } from '../../hooks/useRegistration.js';
import { validateBaselineForm } from '../../services/baselineValidation.js';
import {
  getModifiedFields,
  hasSensitiveChanges,
} from '../../services/registrationReview.js';

import {
  ACADEMIC_LEVEL_OPTIONS,
  CONSUMPTION_REASON_OPTIONS,
} from '../../types/baselineCatalogs.js';
import { getCurrentDateInBogota } from '../../../../shared/utils/dateUtils.js';

import styles from './BaselinePage.module.css';

const INITIAL_BASELINE = {
  age: '',
  educationalInstitution: '',
  academicProgram: '',
  semester: '',
  academicLevel: '',
  city: '',
  consumptionStartDate: '',
  consumptionReason: '',
  lastConsumptionDate: '',
  consumptionFrequency: '',
};

export function BaselinePage() {
  const navigate = useNavigate();

  const currentDate = getCurrentDateInBogota();

  const {
    account,
    consent,
    baseline,
    baselineSnapshot,
    isEditingFromReview,
    reviewEditSection,
    saveAccount,
    saveBaseline,
    saveEditedBaseline,
    cancelReviewEdit,
  } = useRegistration();

  const [form, setForm] = useState(
    baseline ?? INITIAL_BASELINE,
  );

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

    useEffect(() => {
  if (!isEditingFromReview || !reviewEditSection) {
    return;
  }

  const sectionId =
    reviewEditSection === 'academic'
      ? 'academic-section'
      : 'consumption-section';

  requestAnimationFrame(() => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  });
}, [
  isEditingFromReview,
  reviewEditSection,
]);

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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];

      return nextErrors;
    });

    if (
      name === 'consumptionStartDate' ||
      name === 'lastConsumptionDate'
    ) {
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.lastConsumptionDate;

        return nextErrors;
      });
    }

    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validateBaselineForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      const firstInvalidField =
        Object.keys(validationErrors)[0];

      requestAnimationFrame(() => {
        document
          .getElementById(firstInvalidField)
          ?.focus();
      });

      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const normalizedBaseline = {
        age: form.age,
        educationalInstitution:
          form.educationalInstitution.trim(),
        academicProgram:
          form.academicProgram.trim(),
        semester: form.semester,
        academicLevel: form.academicLevel,
        city: form.city.trim(),
        consumptionStartDate:
          form.consumptionStartDate,
        consumptionReason:
          form.consumptionReason,
        lastConsumptionDate:
          form.lastConsumptionDate,
        consumptionFrequency:
          form.consumptionFrequency,
      };

      if (isEditingFromReview) {
        const response = await updateRegistrationData({
          userId: account.userId,
          baseline: normalizedBaseline,
        });

        /*
        * Comparamos también contra el snapshot del contexto.
        * Este es el dato que representa la información cubierta
        * por el consentimiento vigente.
        */
        const modifiedFields = getModifiedFields(
          baselineSnapshot,
          response.baseline,
        );

        const sensitiveChanges =
          hasSensitiveChanges(modifiedFields);

        saveEditedBaseline({
          baseline: response.baseline,
          modifiedFields,
          consentIsValid: !sensitiveChanges,
        });

        navigate('/registro/revision');

        return;
      }

      const response = await saveBaselineData({
        userId: account.userId,
        baseline: normalizedBaseline,
      });

      saveBaseline(response.baseline);

      saveAccount({
        ...account,
        registrationStatus:
          response.registrationStatus,
      });

      navigate('/registro/revision');
    } catch (error) {
      if (error.code === 'CONSENT_REQUIRED') {
        navigate('/registro/consentimiento', {
          replace: true,
        });

        return;
      }

      setSubmitError(
        'No pudimos guardar la línea base. Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => {
            if (isEditingFromReview) {
              cancelReviewEdit();
              navigate('/registro/revision');

              return;
            }

            navigate('/registro/consentimiento');
          }}
          aria-label={
            isEditingFromReview
              ? 'Cancelar edición y volver a revisión'
              : 'Volver al consentimiento'
          }
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Línea base
        </span>
      </header>

      <RegistrationStepper currentStep={3} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 3 de 4
        </span>

        <h1 className={styles.title}>
          {isEditingFromReview
          ? 'Edita tu información'
          : 'Cuéntanos sobre ti'}
        </h1>

        <p className={styles.description}>
          {isEditingFromReview
          ? 'Actualiza los campos necesarios y regresa a la revisión.'
          : 'Esta información permitirá personalizar tu acompañamiento dentro de Brisa.'}
        </p>
      </section>

      {submitError && (
        <div className={styles.alert} role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              No pudimos guardar la información
            </strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset id="academic-section" className={styles.section}>
          <legend className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>
              <GraduationCap
                size={21}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>Datos académicos</strong>
              <small>
                Información general de tu contexto
                educativo.
              </small>
            </span>
          </legend>

          <div className={styles.grid}>
            <TextField
              id="age"
              name="age"
              type="number"
              label="Edad"
              placeholder="Ej. 20"
              inputMode="numeric"
              min="1"
              step="1"
              value={form.age}
              error={errors.age}
              onChange={handleChange}
              required
            />

            <TextField
              id="city"
              name="city"
              label="Ciudad"
              placeholder="Ej. Neiva"
              value={form.city}
              error={errors.city}
              onChange={handleChange}
              startIcon={
                <MapPin
                  size={19}
                  strokeWidth={1.5}
                />
              }
              required
            />
          </div>

          <TextField
            id="educationalInstitution"
            name="educationalInstitution"
            label="Entidad educativa"
            placeholder="Nombre de tu institución"
            value={form.educationalInstitution}
            error={errors.educationalInstitution}
            onChange={handleChange}
            startIcon={
              <BookOpen
                size={19}
                strokeWidth={1.5}
              />
            }
            required
          />

          <TextField
            id="academicProgram"
            name="academicProgram"
            label="Programa académico"
            placeholder="Ej. Ingeniería de Software"
            value={form.academicProgram}
            error={errors.academicProgram}
            onChange={handleChange}
            required
          />

          <div className={styles.grid}>
            <TextField
              id="semester"
              name="semester"
              type="number"
              label="Semestre cursado"
              placeholder="Ej. 8"
              inputMode="numeric"
              min="1"
              step="1"
              value={form.semester}
              error={errors.semester}
              onChange={handleChange}
              required
            />

            <SelectField
              id="academicLevel"
              name="academicLevel"
              label="Nivel académico"
              options={ACADEMIC_LEVEL_OPTIONS}
              value={form.academicLevel}
              error={errors.academicLevel}
              onChange={handleChange}
              required
            />
          </div>
        </fieldset>

        <fieldset id="consumption-section" className={styles.section}>
          <legend className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>
              <CalendarDays
                size={21}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>Datos de consumo</strong>
              <small>
                Responde de acuerdo con tu experiencia
                personal.
              </small>
            </span>
          </legend>

          <div className={styles.sensitiveNotice}>
            Esta sección contiene información sensible.
            Tus respuestas serán tratadas de acuerdo con
            el consentimiento aceptado.
          </div>

          <div className={styles.grid}>
            <TextField
              id="consumptionStartDate"
              name="consumptionStartDate"
              type="date"
              label="Fecha aproximada de inicio"
              max={currentDate}
              value={form.consumptionStartDate}
              error={errors.consumptionStartDate}
              onChange={handleChange}
              required
            />

            <TextField
              id="lastConsumptionDate"
              name="lastConsumptionDate"
              type="date"
              label="Fecha de último consumo"
              min={form.consumptionStartDate || undefined}
              max={currentDate}
              value={form.lastConsumptionDate}
              error={errors.lastConsumptionDate}
              onChange={handleChange}
              required
            />
          </div>

          <SelectField
            id="consumptionReason"
            name="consumptionReason"
            label="Motivo principal de inicio"
            options={CONSUMPTION_REASON_OPTIONS}
            value={form.consumptionReason}
            error={errors.consumptionReason}
            onChange={handleChange}
            required
          />

          <TextField
            id="consumptionFrequency"
            name="consumptionFrequency"
            type="number"
            label="Frecuencia diaria aproximada"
            placeholder="Número de veces al día"
            hint="Puedes ingresar 0 si actualmente no consumes."
            inputMode="numeric"
            min="0"
            step="1"
            value={form.consumptionFrequency}
            error={errors.consumptionFrequency}
            onChange={handleChange}
            required
          />
        </fieldset>

        <Button
          type="submit"
          size="large"
          fullWidth
          loading={isSubmitting}
          loadingText={
            isEditingFromReview
            ? 'Guardando cambios...'
            : 'Guardando líneas base...'
          }
        >
          {isEditingFromReview
          ? 'Guardar cambios'
          : 'Continuar a revisión'}
        </Button>
      </form>
    </div>
  );
}