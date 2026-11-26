/*
 * Siguiente opción activa de un combobox con las flechas. Recorre
 * la lista de forma circular; otras teclas no la cambian.
 */
export function getNextActiveIndex(key, currentIndex, optionCount) {
  if (optionCount === 0) {
    return -1;
  }

  if (key === 'ArrowDown') {
    return currentIndex < optionCount - 1 ? currentIndex + 1 : 0;
  }

  if (key === 'ArrowUp') {
    return currentIndex > 0 ? currentIndex - 1 : optionCount - 1;
  }

  return currentIndex;
}
