import { useState, useEffect, useCallback } from "react";
import type { MessageThread } from "@/types";
import apiClient from "@/services/api";
import { AxiosError } from "axios";

interface UseClientMessagesResult {
  threads: MessageThread[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useClientMessages = (): UseClientMessagesResult => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: response } = await apiClient.get<any>("/api/client/messages");
      
      if (response.success) {
        const { bookings, conversations } = response.data;
        
        // Map backend conversations to frontend MessageThread format
        const mapped: MessageThread[] = bookings.map((b: any) => {
          const conv = conversations.find((c: any) => c._id === b._id);
          return {
            id: b._id,
            name: b.providerId?.userId?.name || "Expert",
            lastMessage: conv?.lastMessage || "No messages yet",
            timestamp: conv?.lastMessageAt 
              ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : "",
            isUnread: (conv?.unreadCount || 0) > 0,
          };
        });
        setThreads(mapped);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(new Error(err.response?.data?.message || err.message));
      } else {
        setError(err instanceof Error ? err : new Error("Failed to load messages"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return { threads, isLoading, error, refresh: fetchThreads };
};
