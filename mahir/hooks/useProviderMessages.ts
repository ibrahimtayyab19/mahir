import { useState, useEffect, useCallback } from "react";
import type { MessageThread } from "@/types";

interface UseProviderMessagesResult {
  threads: MessageThread[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

import { MOCK_THREADS } from "@/constants/mockData";

/**
 * Custom hook for Provider Messages screen.
 * For Phase 3: Uses mock data from constants/mockData.ts.
 */
export const useProviderMessages = (): UseProviderMessagesResult => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulated network latency for 3G/4G tolerance
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setThreads(MOCK_THREADS);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load messages")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return { threads, isLoading, error, refresh: fetchThreads };
};
