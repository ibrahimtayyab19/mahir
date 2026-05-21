import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/design-tokens";

/**
 * App entry point.
 * Checks AsyncStorage for an existing JWT token + role,
 * then redirects to the appropriate screen.
 */
export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const [token, role] = await Promise.all([
          AsyncStorage.getItem("mahir_token"),
          AsyncStorage.getItem("mahir_role"),
        ]);

        if (token && role === "client") {
          router.replace("/(client)");
        } else if (token && role === "provider") {
          router.replace("/(provider)");
        } else {
          router.replace("/(auth)/signup");
        }
      } catch {
        // On any error, default to auth flow
        router.replace("/(auth)/signup");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
