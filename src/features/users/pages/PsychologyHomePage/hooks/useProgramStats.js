import { useEffect, useState } from 'react';
import { obtenerEstadisticasPrograma } from '@/features/users/api/obtenerEstadisticasPrograma.js';

export function useProgramStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setStats(null);
      setError('');
      try {
        const result = await obtenerEstadisticasPrograma({
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setStats(result);
      } catch (failure) {
        if (controller.signal.aborted) return;
        const status = failure.response?.status;
        setError(
          status === 401
            ? 'Tu sesión expiró. Vuelve a iniciar sesión para consultar las estadísticas.'
            : status === 403
              ? 'No tienes permisos para consultar las estadísticas del programa.'
              : 'No pudimos cargar las estadísticas. Intenta nuevamente.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  return {
    stats,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
