import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * useStudentMetrics — canonical hook for all student career metrics.
 * Consumes GET /api/metrics/student (created in Phase 2, commit 8c81e26).
 *
 * IMPORTANT: score of 0 is valid. Components MUST use `score != null ? score : fallback`
 * never `score || fallback`.
 */
const useStudentMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/metrics/student');
      setMetrics(res?.data ?? res ?? null);
    } catch (err) {
      setError(err?.message || 'Failed to load metrics');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { metrics, loading, error, refresh };
};

export default useStudentMetrics;
