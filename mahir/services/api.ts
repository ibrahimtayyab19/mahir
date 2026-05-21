import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// ─── Singleton Axios Instance ─────────────────────────────────────────────────

const BASE_URL =
  process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("mahir_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage read failed — proceed without token
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor — handle 401 & network errors ──────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 1. Handle 401 Unauthorized
    if (error.response?.status === 401) {
      try {
        await Promise.all([
          AsyncStorage.removeItem("mahir_token"),
          AsyncStorage.removeItem("mahir_userId"),
          AsyncStorage.removeItem("mahir_name"),
          AsyncStorage.removeItem("mahir_role"),
        ]);
      } catch { /* ignore */ }
      router.replace("/(auth)/login");
      return Promise.reject(error);
    }

    // 2. Handle Network Timeout
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      Alert.alert("Network Timeout", "The AI is taking longer than expected. Please check your connection and try again.");
      return Promise.reject(new Error("Timeout"));
    }

    // 3. Handle Server Errors (5xx)
    if (error.response?.status && error.response.status >= 500) {
      Alert.alert("Server Busy", "Mahir's agent brain is under heavy load. Please try again in a few moments.");
      return Promise.reject(new Error("Server error"));
    }

    // 4. Fallback Connection Error
    if (!error.response) {
      Alert.alert("Connection Error", "Please check your internet connection.");
      return Promise.reject(new Error("Network error"));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
