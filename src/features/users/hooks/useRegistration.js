import { useContext } from 'react';

import { RegistrationContext } from '../context/registrationContext.js';

export function useRegistration() {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error(
      'useRegistration debe utilizarse dentro de RegistrationProvider.',
    );
  }

  return context;
}