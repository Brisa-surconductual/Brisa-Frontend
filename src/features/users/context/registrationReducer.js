import {
  CONSENT_STATUS,
} from '../types/registrationStatus.js';

export const REGISTRATION_ACTION =
  Object.freeze({
    SAVE_ACCOUNT: 'SAVE_ACCOUNT',
    SAVE_CONSENT: 'SAVE_CONSENT',
    SAVE_BASELINE: 'SAVE_BASELINE',
    SAVE_EDITED_BASELINE:
      'SAVE_EDITED_BASELINE',
    START_REVIEW_EDIT:
      'START_REVIEW_EDIT',
    CANCEL_REVIEW_EDIT:
      'CANCEL_REVIEW_EDIT',
    RENEW_CONSENT: 'RENEW_CONSENT',
    RESET_REGISTRATION:
      'RESET_REGISTRATION',
  });

export function createInitialRegistrationState() {
  return {
    account: null,
    consent: null,
    baseline: null,

    /*
     * Primera versión de la línea base que llegó
     * a revisión. Se utiliza como referencia para
     * identificar modificaciones posteriores.
     */
    baselineSnapshot: null,

    modifiedFields: [],
    isEditingFromReview: false,
    reviewEditSection: null,
  };
}

function createFinishedEditState() {
  return {
    isEditingFromReview: false,
    reviewEditSection: null,
  };
}

export function registrationReducer(
  state,
  action,
) {
  switch (action.type) {
    case REGISTRATION_ACTION.SAVE_ACCOUNT:
      return {
        ...state,
        account: action.payload,
      };

    case REGISTRATION_ACTION.SAVE_CONSENT:
      return {
        ...state,
        consent: action.payload,
      };

    case REGISTRATION_ACTION.SAVE_BASELINE: {
      const baseline = action.payload;

      return {
        ...state,
        baseline,

        /*
         * El snapshot solo se crea durante el
         * primer guardado de la línea base.
         */
        baselineSnapshot:
          state.baselineSnapshot ?? {
            ...baseline,
          },

        modifiedFields: [],
        ...createFinishedEditState(),
      };
    }

    case REGISTRATION_ACTION
      .SAVE_EDITED_BASELINE: {
      const {
        baseline,
        modifiedFields,
        consentIsValid,
      } = action.payload;

      return {
        ...state,
        baseline,
        modifiedFields,
        ...createFinishedEditState(),

        consent: state.consent
          ? {
              ...state.consent,

              status: consentIsValid
                ? CONSENT_STATUS.VALID
                : CONSENT_STATUS.INVALID,
            }
          : null,
      };
    }

    case REGISTRATION_ACTION
      .START_REVIEW_EDIT:
      return {
        ...state,
        isEditingFromReview: true,
        reviewEditSection: action.payload,
      };

    case REGISTRATION_ACTION
      .CANCEL_REVIEW_EDIT:
      return {
        ...state,
        ...createFinishedEditState(),
      };

    case REGISTRATION_ACTION
      .RENEW_CONSENT:
      return {
        ...state,
        consent: action.payload,

        /*
         * Después del reconsentimiento, la línea
         * base actual se convierte en la nueva
         * referencia cubierta por el consentimiento.
         */
        baselineSnapshot: state.baseline
          ? {
              ...state.baseline,
            }
          : null,

        modifiedFields: [],
        ...createFinishedEditState(),
      };

    case REGISTRATION_ACTION
      .RESET_REGISTRATION:
      return createInitialRegistrationState();

    default:
      return state;
  }
}