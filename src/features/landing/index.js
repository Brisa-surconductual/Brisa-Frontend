import { lazy } from 'react';

// Superficie pública de la feature. La landing se carga con React.lazy para
// que su código (motion, fuentes serif, CSS) no entre al bundle de la app
// autenticada: solo se descarga al visitar «/».
export const LandingPage = lazy(() =>
  import('./pages/LandingPage/index.js').then((module) => ({
    default: module.LandingPage,
  })),
);
