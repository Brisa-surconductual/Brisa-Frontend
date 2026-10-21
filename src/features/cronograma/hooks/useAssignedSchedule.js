import { useEffect, useState } from 'react';
import { obtenerMiCronograma } from '../api/cronograma/obtenerMiCronograma.js';

export function useAssignedSchedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await obtenerMiCronograma();
        if (active) setSchedule(data);
      } catch (failure) {
        if (!active) return;
        setSchedule(null);
        if (failure.response?.status !== 404)
          setError('No pudimos consultar tu cronograma. Intenta nuevamente.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    schedule,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
