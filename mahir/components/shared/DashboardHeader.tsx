import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { Colors, Typography } from "@/constants/design-tokens";

interface DashboardHeaderProps {
  onNotificationPress?: () => void;
}

/**
 * Top app bar specifically for authenticated dashboards.
 * Matches: <header class="... flex justify-between items-center px-margin-mobile py-4 bg-[#F9F7F6]">
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onNotificationPress,
}) => (
  <View style={styles.container}>
    <View style={styles.leftGroup}>
      <Text style={styles.wordmark}>Mahir.</Text>
    </View>
    <Pressable
      onPress={onNotificationPress}
      style={styles.iconButton}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <Bell size={24} color={Colors.onSurface} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    // Using zIndex to ensure it sits above content if absolutely positioned later
    zIndex: 50,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  wordmark: {
    ...Typography.headlineXlMobile,
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
    borderRadius: 9999,
  },
});

export default DashboardHeader;
