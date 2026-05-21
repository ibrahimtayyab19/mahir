import { useState, useEffect, useCallback } from "react";
import type { DashboardMetric } from "@/types";
import { useAuthStore } from "@/store/authStore";

import { MOCK_DASHBOARD_METRICS } from "@/constants/mockData";

interface UseClientDashboardResult {
  metrics: DashboardMetric[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  userName: string;
}

/**
 * Custom hook managing business logic for the Client Dashboard.
 * Reads user name from authStore. Metrics are static suggestions
 * (informational cards — they don't need an API call).
 */
export const useClientDashboard = (): UseClientDashboardResult => {
  const userName = useAuthStore((s) => s.userName) ?? "there";
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Static suggestion cards from mockData
      setMetrics(MOCK_DASHBOARD_METRICS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load metrics"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refresh: fetchMetrics,
    userName,
  };
};
