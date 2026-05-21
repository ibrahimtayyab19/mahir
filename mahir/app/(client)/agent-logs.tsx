import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography } from "@/constants/design-tokens";

/**
 * Agent Logs screen — placeholder.
 * Full implementation in Batch D.
 */
export default function AgentLogsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Agent Logs</Text>
        <Text style={styles.subtitle}>Loading will be implemented in Batch D...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
});
