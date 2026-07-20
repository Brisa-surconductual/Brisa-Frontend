import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { RegistrationContext } from './registrationContext.js';

const INITIAL_REGISTRATION = {
  account: null,
  consent: null,
  baseline: null,

  /*
   * Primera versión de la línea base que llegó a revisión.
   * Se utiliza como referencia para detectar modificaciones.
   */
  baselineSnapshot: null,

  modifiedFields: [],
  isEditingFromReview: false,
  reviewEditSection: null,
};

export function RegistrationProvider({ children }) {
  const [registration, setRegistration] = useState(
    INITIAL_REGISTRATION,
  );

  const saveAccount = useCallback((account) => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      account,
    }));
  }, []);

  const saveConsent = useCallback((consent) => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      consent,
    }));
  }, []);

  const saveBaseline = useCallback((baseline) => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      baseline,

      /*
       * Solo guardamos el snapshot la primera vez.
       * Las ediciones posteriores no deben reemplazarlo hasta
       * que el consentimiento sea renovado.
       */
      baselineSnapshot:
        currentRegistration.baselineSnapshot ?? baseline,

      modifiedFields: [],
      isEditingFromReview: false,
      reviewEditSection: null,
    }));
  }, []);

  const saveEditedBaseline = useCallback(
    ({
      baseline,
      modifiedFields,
      consentIsValid,
    }) => {
      setRegistration((currentRegistration) => ({
        ...currentRegistration,
        baseline,
        modifiedFields,
        isEditingFromReview: false,
        reviewEditSection: null,

        consent: currentRegistration.consent
          ? {
              ...currentRegistration.consent,
              status: consentIsValid
                ? 'VIGENTE'
                : 'NO_VIGENTE',
            }
          : null,
      }));
    },
    [],
  );

  const startReviewEdit = useCallback((section) => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      isEditingFromReview: true,
      reviewEditSection: section,
    }));
  }, []);

  const cancelReviewEdit = useCallback(() => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      isEditingFromReview: false,
      reviewEditSection: null,
    }));
  }, []);

  const renewConsent = useCallback((consent) => {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      consent,

      /*
       * Después del reconsentimiento, la versión actual de los
       * datos se convierte en la nueva referencia vigente.
       */
      baselineSnapshot: currentRegistration.baseline,
      modifiedFields: [],
      isEditingFromReview: false,
      reviewEditSection: null,
    }));
  }, []);

  const resetRegistration = useCallback(() => {
    setRegistration(INITIAL_REGISTRATION);
  }, []);

  const contextValue = useMemo(
    () => ({
      ...registration,
      saveAccount,
      saveConsent,
      saveBaseline,
      saveEditedBaseline,
      startReviewEdit,
      cancelReviewEdit,
      renewConsent,
      resetRegistration,
    }),
    [
      registration,
      saveAccount,
      saveConsent,
      saveBaseline,
      saveEditedBaseline,
      startReviewEdit,
      cancelReviewEdit,
      renewConsent,
      resetRegistration,
    ],
  );

  return (
    <RegistrationContext.Provider value={contextValue}>
      {children}
    </RegistrationContext.Provider>
  );
}