import { create } from "zustand";
import { Socket } from "socket.io-client";
import { socketService } from "@/services/socketService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocketState {
  isConnected: boolean;
  activeJobs: any[]; // List of available jobs from the broadcast
  connect: () => void;
  disconnect: () => void;
  
  // ── Provider Actions ──────────────────────────────────────────────────
  emitProviderOnline: (
    providerId: string,
    latitude: number,
    longitude: number,
    serviceCategory: string,
    city: string,
    area: string
  ) => void;
  emitProviderOffline: (providerId: string) => void;

  // ── Event Listeners ──────────────────────────────────────────────────
  initListeners: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  activeJobs: [],

  connect: () => {
    const socket = socketService.connect();
    
    socket.on("connect", () => {
      set({ isConnected: true });
      get().initListeners();
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });
  },

  disconnect: () => {
    socketService.disconnect();
    set({ isConnected: false, activeJobs: [] });
  },

  initListeners: () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Remove old listeners to prevent duplicates
    socket.off("job:new");
    socket.off("job:deleted");
    socket.off("booking:status");

    // ── Listen for new jobs in the area ────────────────────────────────
    socket.on("job:new", (job: any) => {
      console.log("📡 [SocketStore] New job broadcast received:", job.jobId);
      set((state) => ({
        activeJobs: [job, ...state.activeJobs],
      }));
    });

    // ── Listen for jobs being taken/expired ───────────────────────────
    socket.on("job:deleted", ({ jobId }: { jobId: string }) => {
      console.log("📡 [SocketStore] Job deleted/matched:", jobId);
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.jobId !== jobId),
      }));
    });

    // ── Listen for booking status updates (Client & Provider) ──────────
    socket.on("booking:status", (payload: any) => {
      console.log("📡 [SocketStore] Booking status update:", payload.status);
      // Logic for updating booking state could go here or in a separate store
    });
  },

  emitProviderOnline: (
    providerId: string,
    latitude: number,
    longitude: number,
    serviceCategory: string,
    city: string,
    area: string
  ) => {
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit("provider:online", {
        providerId,
        latitude,
        longitude,
        serviceCategory,
        city,
        area,
      });
    }
  },

  emitProviderOffline: (providerId: string) => {
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit("provider:offline", { providerId });
    }
  },
}));
