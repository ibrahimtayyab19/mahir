import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import { AxiosError } from "axios";

interface UseClientJobsResult {
  jobs: any[]; 
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useClientJobs = (): UseClientJobsResult => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: response } = await apiClient.get<any>("/api/client/bookings");
      
      if (response.success) {
        // Map backend bookings to frontend job cards
        const mapped = response.data.map((b: any) => ({
          id: b._id,
          title: b.jobPostId?.title || b.serviceType,
          location: b.jobPostId?.address || "Islamabad",
          estimatedPrice: `PKR ${b.pricing?.totalEstimate?.toLocaleString() || "TBD"}`,
          status: b.status,
          providerName: b.providerId?.userId?.name || "Expert",
          timeAgo: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recently",
          description: b.jobPostId?.descriptionEN || "",
        }));
        setJobs(mapped);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(new Error(err.response?.data?.message || err.message));
      } else {
        setError(err instanceof Error ? err : new Error("Failed to load bookings"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, refresh: fetchJobs };
};
