import { CHAT } from '@/shared/utils/constans.jsx';

// RF-25C. El backend publica estas operaciones solo bajo /administracion.
// Las respuestas de este grupo NO vienen envueltas en `{ data }`.
export const RUTA_ARBOLES_PERSONALIZADOS = `${CHAT}/administracion/arboles-personalizados`;
