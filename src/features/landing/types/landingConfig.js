// Configuración de la landing pública. Nada de esto viene del backend:
// la landing no hace llamadas a la API ni usa analítica de terceros.

// Rutas reales de la app (app/router). No se inventan rutas nuevas.
export const LANDING_ROUTES = Object.freeze({
  REGISTER: '/registro/cuenta',
  LOGIN: '/login',
});

// La cantidad de semanas del programa NO está definida (A-071). Mientras
// sea null no se muestra ningún número fijo: el recorrido enseña
// JOURNEY_PREVIEW_WEEKS semanas de ejemplo y una marca de «y las que siguen».
// Cuando el equipo lo defina, basta con poner el número aquí.
export const JOURNEY_TOTAL_WEEKS = null;
export const JOURNEY_PREVIEW_WEEKS = 4;

// Opción B (evolución, NO activa): hero WebGL con React Three Fiber y/o
// GSAP ScrollTrigger + Lenis, detrás de este flag y con import dinámico.
// Costo/riesgo: +150–400 KB gzip, consumo de batería y GPU en gama baja,
// y más difícil de hacer accesible (alternativa de texto, movimiento
// reducido, foco). Por eso hoy el hero es DOM + CSS (Opción A).
export const HERO_WEBGL_ENABLED = false;

export const INSTALL_STATE = Object.freeze({
  NATIVE: 'native',
  IOS: 'ios',
  OTHER: 'other',
  INSTALLED: 'installed',
});
