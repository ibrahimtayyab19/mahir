import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "client" | "provider";

interface AuthState {
  token: string | null;
  userId: string | null;
  userName: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Persist auth data to state + AsyncStorage */
  login: (
    token: string,
    userId: string,
    name: string,
    role: string
  ) => Promise<void>;

  /** Clear all auth data from state + AsyncStorage */
  logout: () => Promise<void>;

  /** Hydrate state from AsyncStorage on app start */
  loadFromStorage: () => Promise<void>;

  /** Backward-compatible role setter (used by signup selection) */
  setRole: (role: UserRole) => void;
}

// ─── AsyncStorage Keys ────────────────────────────────────────────────────────

const KEYS = {
  TOKEN: "mahir_token",
  USER_ID: "mahir_userId",
  NAME: "mahir_name",
  ROLE: "mahir_role",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidRole = (val: string | null): val is UserRole =>
  val === "client" || val === "provider";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  userName: null,
  role: null,
  isAuthenticated: false,
  isLoading: true, // True until loadFromStorage completes

  login: async (
    token: string,
    userId: string,
    name: string,
    role: string
  ): Promise<void> => {
    const validRole: UserRole = isValidRole(role) ? role : "client";

    try {
      await Promise.all([
        AsyncStorage.setItem(KEYS.TOKEN, token),
        AsyncStorage.setItem(KEYS.USER_ID, userId),
        AsyncStorage.setItem(KEYS.NAME, name),
        AsyncStorage.setItem(KEYS.ROLE, validRole),
      ]);
    } catch (error) {
      console.error("[AuthStore] login persist failed:", error);
    }

    set({
      token,
      userId,
      userName: name,
      role: validRole,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.TOKEN),
        AsyncStorage.removeItem(KEYS.USER_ID),
        AsyncStorage.removeItem(KEYS.NAME),
        AsyncStorage.removeItem(KEYS.ROLE),
      ]);
    } catch (error) {
      console.error("[AuthStore] logout clear failed:", error);
    }

    set({
      token: null,
      userId: null,
      userName: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadFromStorage: async (): Promise<void> => {
    try {
      const [token, userId, userName, rawRole] = await Promise.all([
        AsyncStorage.getItem(KEYS.TOKEN),
        AsyncStorage.getItem(KEYS.USER_ID),
        AsyncStorage.getItem(KEYS.NAME),
        AsyncStorage.getItem(KEYS.ROLE),
      ]);

      const role = isValidRole(rawRole) ? rawRole : null;

      if (token && userId && role) {
        set({
          token,
          userId,
          userName,
          role,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("[AuthStore] loadFromStorage failed:", error);
      set({ isLoading: false });
    }
  },

  setRole: (role: UserRole) => {
    set({ role });
  },
}));
