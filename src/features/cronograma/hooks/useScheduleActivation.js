import { useRef, useState } from 'react';
import { activarCronograma } from '../api/cronograma/activarCronograma.js';

export function useScheduleActivation({ schedule, onActivated }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  function requestActivation() {
    setError('');
    setOpen(true);
  }
  function cancelActivation() {
    if (!pending.current) setOpen(false);
  }
  async function confirmActivation() {
    if (pending.current) return;
    pending.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await activarCronograma(schedule.idCronograma);
      onActivated({
        ...schedule,
        estado: result.estado,
        esBase: result.es_base,
      });
      setOpen(false);
    } catch (failure) {
      const message = failure.response?.data?.message;
      setError(
        typeof message === 'string'
          ? message
          : 'No pudimos activar el cronograma. Intenta nuevamente.',
      );
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }
  return {
    open,
    isSubmitting,
    error,
    requestActivation,
    cancelActivation,
    confirmActivation,
  };
}
