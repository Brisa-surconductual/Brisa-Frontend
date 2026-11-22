import { viewHasData } from './cohortDashboard.js';

/*
 * Caché del panel principal (RF-140): última vista VÁLIDA de cada
 * sección, por cohorte. Solo en memoria de la aplicación (se pierde al
 * recargar la página); no usa localStorage ni sessionStorage.
 *
 * - Guarda vistas ya interpretadas: solo los campos agregados de la
 *   lista explícita de cada vista, nunca perfiles ni datos individuales.
 * - Aislada por cohorte: lo de una cohorte nunca se devuelve para otra.
 * - Solo guarda vistas con datos (disponibles o desactualizadas); nunca
 *   fabrica una versión anterior.
 *
 * Es el comportamiento demostrativo del frontend. La estrategia
 * productiva (RF-140: «conserva la última versión consolidada en
 * caché») corresponde al backend y está PENDIENTE de definir.
 */
export function createDashboardCache() {
  const store = new Map();

  return Object.freeze({
    remember(cohortId, section, view, loadedAt) {
      if (!cohortId || !viewHasData(view)) return;

      if (!store.has(cohortId)) store.set(cohortId, new Map());
      store.get(cohortId).set(section, Object.freeze({ view, loadedAt }));
    },

    recall(cohortId, section) {
      return store.get(cohortId)?.get(section) ?? null;
    },

    clear() {
      store.clear();
    },
  });
}

// Caché única de la sesión de la aplicación.
export const dashboardCache = createDashboardCache();
