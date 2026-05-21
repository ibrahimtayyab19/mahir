import { useState, useEffect, useCallback } from "react";
import type { ProviderActiveJob } from "@/types";

interface UseProviderActiveJobResult {
  activeJob: ProviderActiveJob | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

import { MOCK_ACTIVE_JOB } from "@/constants/mockData";

/**
 * Custom hook for Provider Active Job Workspace.
 * For Phase 3: Uses mock data from constants/mockData.ts.
 */
export const useProviderActiveJob = (): UseProviderActiveJobResult => {
  const [activeJob, setActiveJob] = useState<ProviderActiveJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveJob = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulated network latency for 3G/4G tolerance
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setActiveJob(MOCK_ACTIVE_JOB);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load active job")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveJob();
  }, [fetchActiveJob]);

  return { activeJob, isLoading, error, refresh: fetchActiveJob };
};
