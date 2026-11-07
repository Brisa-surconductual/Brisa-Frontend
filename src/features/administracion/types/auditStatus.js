// Estado de una acción auditada (RF-123, estado_accion). Lo decide el
// backend al registrar; la interfaz solo lo presenta.
export const AUDIT_STATUS = Object.freeze({
  SUCCESS: 'EXITOSA',
  FAILED: 'FALLIDA',
  DENIED: 'DENEGADA',
});
