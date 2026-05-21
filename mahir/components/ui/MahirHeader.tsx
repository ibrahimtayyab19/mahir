import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Colors } from "@/constants/design-tokens";

interface MahirHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Top app bar — "Mahir." wordmark with optional back arrow.
 * Maps from HTML: fixed header, border-bottom, px-6 py-4.
 */
const MahirHeader: React.FC<MahirHeaderProps> = ({
  showBackButton = false,
  onBack,
  rightAction,
}) => (
  <View style={styles.container}>
    <View style={styles.leftGroup}>
      {showBackButton && (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.onSurface} />
        </Pressable>
      )}
      <Text style={styles.wordmark}>Mahir.</Text>
    </View>
    {rightAction && <View>{rightAction}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 9999,
  },
  wordmark: {
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.onSurface,
  },
});

export default MahirHeader;
