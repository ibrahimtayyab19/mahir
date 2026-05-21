import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors, Typography } from "@/constants/design-tokens";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import type { ErrorBoundaryFallbackProps } from "@/types";

/**
 * Fallback UI for React Error Boundaries.
 * Prevents red screens and allows graceful recovery.
 */
export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={48} color={Colors.error} />
      </View>
      <Text style={styles.heading}>Something went wrong</Text>
      <Text style={styles.message}>
        We encountered an unexpected error. Our team has been notified.
      </Text>
      
      {/* Dev only error message - ideally hidden in prod behind __DEV__ */}
      <View style={styles.errorBox}>
        <Text style={styles.errorText} numberOfLines={3}>
          {error.message}
        </Text>
      </View>

      <Pressable onPress={resetError} style={styles.button}>
        <RefreshCw size={20} color={Colors.onError} style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: Colors.surfaceContainerHighest,
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: "100%",
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: "monospace",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    ...Typography.labelMd,
    color: Colors.onError,
  },
});

export default ErrorBoundaryFallback;
