import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, Bell, X } from "lucide-react-native";
import DashboardHeader from "@/components/shared/DashboardHeader";
import InfoCard from "@/components/shared/InfoCard";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Colors, Typography, Radii, Spacing } from "@/constants/design-tokens";

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

function ClientDashboardContent() {
  const router = useRouter();
  const { metrics, isLoading, error, userName } = useClientDashboard();
  const [inputText, setInputText] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  if (error) {
    throw error; // Let ErrorBoundary catch it
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DashboardHeader />
        <LoadingSkeleton type="dashboard" />
      </SafeAreaView>
    );
  }

  const handleFindExpert = (textOverride?: string) => {
    const textToSubmit = textOverride || inputText.trim();
    if (textToSubmit.length === 0) return;

    router.push({
      pathname: "/(client)/chat",
      params: {
        initialMessage: textToSubmit,
      },
    });
  };

  const handleSuggestionPress = (id: string) => {
    const suggestion = metrics.find((m) => m.id === id);
    if (suggestion) {
      setInputText(suggestion.title);
      handleFindExpert(suggestion.title);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DashboardHeader onNotificationPress={() => setIsNotificationVisible(true)} />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.main}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Hello, {userName} 👋</Text>
            <Text style={styles.greetingSubtitle}>Tell me what you need done...</Text>
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={metrics}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <InfoCard metric={item} onPress={handleSuggestionPress} />
              )}
              initialNumToRender={3}
              windowSize={5}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
          </View>

          {/* Text Input + Find Expert Button */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your request in Urdu, Roman Urdu, or English..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              numberOfLines={3}
              textAlignVertical="top"
            />
            

            <Pressable
              style={[
                styles.findButton,
                {
                  opacity: inputText.trim().length === 0 ? 0.5 : 1,
                },
              ]}
              onPress={() => handleFindExpert()}
              disabled={inputText.trim().length === 0}
              accessibilityRole="button"
            >
              <Text style={styles.findButtonText}>Find Expert</Text>
              <ArrowRight size={18} color={Colors.onPrimaryContainer} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Notification Modal */}
      <Modal
        visible={isNotificationVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable
                onPress={() => setIsNotificationVisible(false)}
                style={styles.closeIcon}
              >
                <X size={24} color={Colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Bell size={48} color={Colors.outlineVariant} />
              </View>
              <Text style={styles.emptyStateTitle}>No new notifications</Text>
              <Text style={styles.emptyStateSubtitle}>
                We'll notify you when there's an update on your requests.
              </Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={() => setIsNotificationVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function ClientDashboard() {
  return (
    <ErrorBoundary>
      <ClientDashboardContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex1: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingTop: 16,
  },
  greetingSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
  listContainer: {
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // ── Text Input + Button ──────────────────────────────────────────
  inputSection: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Account for tab bar
    gap: 12,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 80,
    maxHeight: 120,
  },
  findButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: Radii.default,
  },
  findButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: Colors.secondaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.secondary,
  },
  demoButtonText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontFamily: "Sora_600SemiBold",
  },
  // ── Modal Styles ──────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  closeIcon: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
});
