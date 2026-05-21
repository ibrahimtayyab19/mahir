import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Apple } from "lucide-react-native";
import GoogleLogo from "@/components/icons/GoogleLogo";
import { Colors, Typography } from "@/constants/design-tokens";

interface SocialButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
}

/**
 * Outline social login button with provider logo + label.
 */
const SocialButton: React.FC<SocialButtonProps> = ({ provider, onPress }) => (
  <Pressable
    onPress={onPress}
    style={styles.button}
    accessibilityRole="button"
  >
    <View style={styles.iconContainer}>
      {provider === "google" ? (
        <GoogleLogo size={20} />
      ) : (
        <Apple size={20} color={Colors.onSurface} />
      )}
    </View>
    <Text style={styles.label}>
      Continue with {provider === "google" ? "Google" : "Apple"}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 9999,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.outline + "66",
    backgroundColor: "transparent",
  },
  iconContainer: {
    marginRight: 12,
  },
  label: {
    ...Typography.bodyMd,
    fontFamily: "Sora_600SemiBold",
    color: Colors.onSurface,
  },
});

export default SocialButton;
