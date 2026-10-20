const INSTITUTION = 'Universidad Surcolombiana';

// VITE_APP_VERSION la inyecta vite.config.js desde package.json. En Vitest
// no existe: sin versión, el pie muestra solo la institución.
export function formatAppFooter(version = import.meta.env.VITE_APP_VERSION) {
  return version ? `v${version} · ${INSTITUTION}` : INSTITUTION;
}
