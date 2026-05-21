import apiClient from "./api";

// ─── Response Interfaces ──────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider";
}

interface AuthPayload {
  token: string;
  user: AuthUser;
}

interface AuthResponse {
  success: boolean;
  data: AuthPayload;
}

interface UserProfileResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    role: "client" | "provider";
    phone?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    location?: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /api/auth/login
   */
  async login(email: string, password: string): Promise<AuthPayload> {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    return data.data;
  },

  /**
   * POST /api/auth/register
   */
  async register(
    name: string,
    email: string,
    password: string,
    role: "client" | "provider",
    phone?: string
  ): Promise<AuthPayload> {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/register", {
      name,
      email,
      password,
      role,
      phone,
    });
    return data.data;
  },

  /**
   * GET /api/auth/me
   */
  async getMe(): Promise<UserProfileResponse["data"]> {
    const { data } = await apiClient.get<UserProfileResponse>("/api/auth/me");
    return data.data;
  },
};
