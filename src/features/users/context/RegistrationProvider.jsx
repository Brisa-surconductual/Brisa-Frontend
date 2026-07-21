import {
  useCallback,
  useMemo,
  useReducer,
} from 'react';

import { RegistrationContext } from './registrationContext.js';

import {
  createInitialRegistrationState,
  REGISTRATION_ACTION,
  registrationReducer,
} from './registrationReducer.js';

export function RegistrationProvider({
  children,
}) {
  const [registration, dispatch] = useReducer(
    registrationReducer,
    undefined,
    createInitialRegistrationState,
  );

  const saveAccount = useCallback((account) => {
    dispatch({
      type: REGISTRATION_ACTION.SAVE_ACCOUNT,
      payload: account,
    });
  }, []);

  const saveConsent = useCallback((consent) => {
    dispatch({
      type: REGISTRATION_ACTION.SAVE_CONSENT,
      payload: consent,
    });
  }, []);

  const saveBaseline = useCallback((baseline) => {
    dispatch({
      type: REGISTRATION_ACTION.SAVE_BASELINE,
      payload: baseline,
    });
  }, []);

  const saveEditedBaseline = useCallback(
    ({
      baseline,
      modifiedFields,
      consentIsValid,
    }) => {
      dispatch({
        type:
          REGISTRATION_ACTION
            .SAVE_EDITED_BASELINE,

        payload: {
          baseline,
          modifiedFields,
          consentIsValid,
        },
      });
    },
    [],
  );

  const startReviewEdit = useCallback(
    (section) => {
      dispatch({
        type:
          REGISTRATION_ACTION
            .START_REVIEW_EDIT,

        payload: section,
      });
    },
    [],
  );

  const cancelReviewEdit = useCallback(() => {
    dispatch({
      type:
        REGISTRATION_ACTION
          .CANCEL_REVIEW_EDIT,
    });
  }, []);

  const renewConsent = useCallback((consent) => {
    dispatch({
      type:
        REGISTRATION_ACTION.RENEW_CONSENT,

      payload: consent,
    });
  }, []);

  const resetRegistration = useCallback(() => {
    dispatch({
      type:
        REGISTRATION_ACTION
          .RESET_REGISTRATION,
    });
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
    <RegistrationContext.Provider
      value={contextValue}
    >
      {children}
    </RegistrationContext.Provider>
  );
}