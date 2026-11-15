import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  createCohort,
  getCohort,
  getCohortSourceMode,
  listSchedules,
  updateCohort,
} from '../../../data/cohortSource.js';
import {
  getActiveSchedules,
  validateCohortForm,
  validateCohortSchedule,
} from '../../../services/cohortValidation.js';
import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';
import {
  INITIAL_COHORT_FORM,
  firstInvalidField,
  normalizeCohortForm,
  toCohortForm,
} from '../../../utils/cohortFormState.js';

export const COHORT_LIST_PATH = '/app/administrativo/cohortes';

export const COHORT_FORM_MODE = Object.freeze({ CREATE: 'create', EDIT: 'edit' });

export const COHORT_FORM_LOAD_ERROR =
  'No pudimos cargar la información del formulario. Intenta nuevamente.';
export const COHORT_SAVE_ERROR =
  'No se pudieron aplicar los cambios. Intenta nuevamente.';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getCohortSourceMode,
  getCohort,
  listSchedules,
  create: createCohort,
  update: updateCohort,
});

/*
 * Creación y edición de cohortes (RF-124). Carga el catálogo de
 * cronogramas y, al editar, la cohorte; valida con las reglas puras
 * de E1 y del cronograma activo; evita envíos dobles y vuelve al
 * listado con un aviso. Sin integración no consulta ni guarda nada.
 *
 * PENDIENTE de especificación: si alguna transición o estado impide
 * editar una cohorte. Hoy se permite editar en cualquier estado.
 */
export function useCohortFormPage({
  mode = COHORT_FORM_MODE.CREATE,
  cohortId = null,
  source = DEFAULT_SOURCE,
} = {}) {
  const navigate = useNavigate();
  const isEdit = mode === COHORT_FORM_MODE.EDIT;

  const [sourceMode] = useState(() => source.getMode());
  const isIntegrationPending = sourceMode === COHORT_SOURCE_MODE.PENDING_INTEGRATION;

  const [form, setForm] = useState(INITIAL_COHORT_FORM);
  const [schedules, setSchedules] = useState([]);
  const [replacedSchedule, setReplacedSchedule] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setLoadError('');
      setNotFound(false);

      try {
        const [catalog, cohort] = await Promise.all([
          source.listSchedules(),
          isEdit ? source.getCohort(cohortId) : null,
        ]);
        if (!active) return;

        const available = Array.isArray(catalog) ? catalog : [];
        setSchedules(available);

        if (isEdit && !cohort) {
          setNotFound(true);
          return;
        }

        if (isEdit) {
          // Un cronograma ya no activo no puede seguir asociado al guardar.
          const values = toCohortForm(cohort);
          setCurrentStatus(cohort.status ?? null);
          const stillActive = getActiveSchedules(available).some(({ id }) => id === values.scheduleId);

          setReplacedSchedule(
            values.scheduleId && !stillActive
              ? available.find(({ id }) => id === values.scheduleId)?.name ?? 'sin nombre disponible'
              : null,
          );
          setForm(stillActive ? values : { ...values, scheduleId: '' });
        }
      } catch {
        if (active) setLoadError(COHORT_FORM_LOAD_ERROR);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isEdit, isIntegrationPending, source]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current) return;

    const validationErrors = {
      ...validateCohortForm(form),
      ...validateCohortSchedule(form.scheduleId, schedules),
    };
    const firstInvalid = firstInvalidField(validationErrors);

    if (firstInvalid) {
      setErrors(validationErrors);
      event.currentTarget?.elements?.namedItem(firstInvalid)?.focus();
      return;
    }

    pending.current = true;
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const values = normalizeCohortForm(form);
      const saved = isEdit
        ? await source.update(cohortId, values)
        : await source.create(values);

      if (!saved) {
        setNotFound(true);
        return;
      }

      navigate(COHORT_LIST_PATH, {
        state: { cohortNotice: { action: mode, name: saved.name } },
      });
    } catch {
      setSubmitError(COHORT_SAVE_ERROR);
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  // Cancelar vuelve al listado sin guardar nada.
  function handleCancel() {
    navigate(COHORT_LIST_PATH);
  }

  const activeSchedules = getActiveSchedules(schedules);

  return {
    isEdit,
    form,
    errors,
    scheduleOptions: activeSchedules.map(({ id, name }) => ({ value: id, label: name })),
    hasActiveSchedules: activeSchedules.length > 0,
    replacedSchedule,
    currentStatus,
    isLoading,
    loadError,
    notFound,
    isSubmitting,
    submitError,
    isDemo: sourceMode === COHORT_SOURCE_MODE.DEMO,
    isIntegrationPending,
    handleChange,
    handleSubmit,
    handleCancel,
    retry: () => setAttempt((value) => value + 1),
  };
}
