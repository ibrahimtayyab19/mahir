import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@/constants/design-tokens";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Full-width primary CTA button.
 * Background: #CEE9BD (primary-container). No shadow.
 * Text: #1A1C18 (on-surface), uppercase, Sora Bold.
 * Rounded-full per design system.
 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.button,
      {
        backgroundColor: disabled ? Colors.outlineVariant : Colors.primaryContainer,
        opacity: disabled ? 0.6 : 1,
      },
    ]}
    accessibilityRole="button"
  >
    <Text style={styles.label}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontFamily: "Sora_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export default PrimaryButton;
