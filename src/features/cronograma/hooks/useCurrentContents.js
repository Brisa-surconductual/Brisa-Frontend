import { useEffect, useState } from 'react';
import { obtenerMiContenidoVigente } from '../api/contenidoVigente/obtenerMiContenidoVigente.jsx';
import { currentContentError } from '../utils/currentContentError.js';
import { mapCurrentContent } from '../utils/currentContent.js';

export function useCurrentContents() {
  const [currentContent, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await obtenerMiContenidoVigente();
        if (active)
          setContents(Array.isArray(data) ? data.map(mapCurrentContent) : []);
      } catch (error) {
        if (active) {
          setContents([]);
          if (error.response?.status !== 404)
            setError(currentContentError(error));
        }
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
    currentContent,
    loading,
    loadError,
    retry: () => setAttempt((value) => value + 1),
  };
}
