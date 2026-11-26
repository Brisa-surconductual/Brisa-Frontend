import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';

import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

import './styles/tokens.css';
import './styles/globals.css';

import { listenInstallPrompt } from './features/users/index.js';

import App from './App.jsx';

// PWA (ADR-0006): el aviso de instalación puede llegar antes de que se
// monte la Home, y el service worker solo se registra en producción.
listenInstallPrompt(window);

if (import.meta.env.PROD) {
  void import('./app/pwa/registerServiceWorker.js').then(
    ({ registerServiceWorker }) => registerServiceWorker(),
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz de la aplicación.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
