import { useEffect, useState } from 'react';

import { listSchedule } from '../../../api/cronograma/listSchedule';

export function getScheduleListErrorMessage(error) {
  return error?.response?.status === 401
    ? 'Tu sesión terminó. Inicia sesión nuevamente.'
    : 'No pudimos cargar los cronogramas. Intenta nuevamente.';
}

/*
 * Listado de cronogramas (GET /cronograma/obtener-cronogramas).
 * Distingue carga, error y lista vacía: una consulta fallida no
 * se presenta como "sin cronogramas".
 */
export function useScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchSchedules() {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await listSchedule();
        if (active) setSchedules(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) {
          setSchedules([]);
          setLoadError(getScheduleListErrorMessage(error));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchSchedules();

    return () => {
      active = false;
    };
  }, [attempt]);

  return {
    schedules,
    isLoading,
    loadError,
    retry: () => setAttempt((value) => value + 1),
  };
}
