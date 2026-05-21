import { useState, useEffect, useCallback } from "react";
import type { DashboardMetric } from "@/types";

import { MOCK_PROVIDER_METRICS } from "@/constants/mockData";

interface UseProviderDashboardResult {
  metrics: DashboardMetric[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook managing business logic for the Provider Dashboard.
 * Enforces Enterprise Directive: separation of concerns and bulletproof error handling.
 */
export const useProviderDashboard = (): UseProviderDashboardResult => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate network request latency
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setMetrics(MOCK_PROVIDER_METRICS);
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
  };
};
