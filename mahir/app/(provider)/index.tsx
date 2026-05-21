import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Power } from "lucide-react-native";
import DashboardHeader from "@/components/shared/DashboardHeader";
import InfoCard from "@/components/shared/InfoCard";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { useRouter } from "expo-router";
import { useProviderDashboard } from "@/hooks/useProviderDashboard";
import { useAuthStore } from "@/store/authStore";
import { Colors, Typography, Radii } from "@/constants/design-tokens";

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorBoundaryFallback error={this.state.error} resetError={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function ProviderDashboardContent() {
  const router = useRouter();
  const { metrics, isLoading, error } = useProviderDashboard();
  const userName = useAuthStore((s) => s.userName) ?? "Provider";

  // Online/Offline toggle state (Mock)
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // ── Toggle Handler (Simulated for Phase 3) ──────────────────────────────────

  const handleToggle = useCallback(async () => {
    if (isToggling) return;

    try {
      setIsToggling(true);
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      
      Alert.alert(
        "Status Updated",
        newStatus 
          ? "You are now visible to clients in your area." 
          : "You are now offline and won't receive new job notifications."
      );
    } catch (err) {
      console.error("[Provider] Toggle failed:", err);
      Alert.alert("Error", "Failed to update your status. Please try again.");
    } finally {
      setIsToggling(false);
    }
  }, [isOnline, isToggling]);

  const handleMetricPress = (id: string) => {
    switch (id) {
      case "1": // Nearby Jobs
        router.push("/(provider)/jobs");
        break;
      case "2": // My Schedule
        router.push("/(provider)/active");
        break;
      case "3": // Today's Earnings
        router.push("/(provider)/profile");
        break;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (error) {
    throw error;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DashboardHeader />
        <LoadingSkeleton type="dashboard" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DashboardHeader />

      <View style={styles.main}>
        {/* Online/Offline Toggle */}
        <View style={styles.toggleSection}>
          <Pressable
            style={[
              styles.toggleButton,
              {
                backgroundColor: isOnline
                  ? "#E8F5E9"
                  : Colors.surfaceContainerHigh,
              },
            ]}
            onPress={handleToggle}
            disabled={isToggling}
            accessibilityRole="switch"
            accessibilityState={{ checked: isOnline }}
            accessibilityLabel={isOnline ? "Go offline" : "Go online"}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={Colors.onSurface} />
            ) : (
              <Power
                size={20}
                color={isOnline ? "#2E7D32" : Colors.onSurfaceVariant}
              />
            )}
            <Text
              style={[
                styles.toggleText,
                { color: isOnline ? "#2E7D32" : Colors.onSurfaceVariant },
              ]}
            >
              {isToggling
                ? "Updating..."
                : isOnline
                ? "Online"
                : "Offline"}
            </Text>
          </Pressable>

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline ? "#4CAF50" : Colors.outline,
              },
            ]}
          />
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Hello, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>
            {isOnline ? "Ready to earn today?" : "Go online to see nearby jobs"}
          </Text>
        </View>

        {/* Metrics Cards */}
        <View style={styles.listContainer}>
          <FlatList
            data={metrics}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <InfoCard metric={item} onPress={handleMetricPress} />}
            initialNumToRender={3}
            windowSize={5}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          />
        </View>


      </View>
    </SafeAreaView>
  );
}

export default function ProviderDashboard() {
  return (
    <ErrorBoundary>
      <ProviderDashboardContent />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  main: {
    flex: 1,
    paddingTop: 8,
  },
  // ── Toggle Section ───────────────────────────────────────────────
  toggleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
  },
  toggleText: {
    ...Typography.labelMd,
    fontFamily: "Sora_700Bold",
    fontSize: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // ── Greeting ─────────────────────────────────────────────────────
  greetingSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  greetingTitle: {
    ...Typography.headlineXlMobile,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  greetingSubtitle: {
    ...Typography.bodySm,
    color: Colors.secondary,
  },
  // ── Metrics ──────────────────────────────────────────────────────
  listContainer: {
    marginBottom: 48,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

});
