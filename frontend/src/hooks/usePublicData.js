import { useCallback, useEffect, useState } from "react";
import { fetchList } from "../api/client";
import { ENDPOINTS } from "../api/config";

// Caché en memoria: al navegar entre páginas no se vuelve a pedir lo mismo.
const cache = new Map();

/**
 * @param {keyof ENDPOINTS} key
 * @param {(item:any, index:number) => any} normalizer
 */
export function usePublicData(key, normalizer) {
  const [state, setState] = useState(() => ({
    data: cache.get(key) ?? [],
    loading: !cache.has(key),
    error: null,
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache.has(key)) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchList(ENDPOINTS[key], controller.signal)
      .then((list) => {
        const data = list.map(normalizer).filter(Boolean);
        cache.set(key, data);
        setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ data: [], loading: false, error });
      });

    return () => controller.abort();
    // normalizer es una función estable importada de módulo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    cache.delete(key);
    setAttempt((a) => a + 1);
  }, [key]);

  return { ...state, retry };
}
