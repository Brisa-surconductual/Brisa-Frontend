/*
 * Escape en un <dialog> modal: cierra solo si no hay una
 * operación en curso, para no interrumpir un guardado.
 */
export function createDialogCancelHandler({ isBusy, onClose }) {
  return function handleCancel(event) {
    event.preventDefault();

    if (!isBusy) {
      onClose();
    }
  };
}
