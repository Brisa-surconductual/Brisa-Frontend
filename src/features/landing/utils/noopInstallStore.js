// Almacén de instalación vacío: se usa cuando la landing se pinta sin el
// almacén real (pruebas, render de servidor). Mismo contrato que el de la app.
const SNAPSHOT = Object.freeze({ disponible: false, instalada: false });

export const noopInstallStore = Object.freeze({
  subscribe: () => () => {},
  getSnapshot: () => SNAPSHOT,
  promptInstall: async () => null,
});
