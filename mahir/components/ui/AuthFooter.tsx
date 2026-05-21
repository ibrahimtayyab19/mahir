import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography } from "@/constants/design-tokens";

interface AuthFooterProps {
  mode: "login" | "signup";
  showFullFooter?: boolean;
}

/**
 * Auth screen footer with account switch link and optional
 * copyright/legal links section.
 */
const AuthFooter: React.FC<AuthFooterProps> = ({
  mode,
  showFullFooter = true,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (mode === "login") {
      router.push("/(auth)/login");
    } else {
      router.push("/(auth)/signup");
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Account switch link */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {mode === "login"
            ? "Already have an account? "
            : "Don't have an account? "}
        </Text>
        <Pressable onPress={handlePress} accessibilityRole="link">
          <Text style={styles.switchLink}>
            {mode === "login" ? "Log In" : "Create Account"}
          </Text>
        </Pressable>
      </View>

      {/* Full footer with copyright and legal links */}
      {showFullFooter && (
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2026 Mahir.</Text>
          <View style={styles.linksRow}>
            <Pressable accessibilityRole="link">
              <Text style={styles.linkText}>Terms of Service</Text>
            </Pressable>
            <Pressable accessibilityRole="link">
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            <Pressable accessibilityRole="link">
              <Text style={styles.linkText}>Accessibility</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },
  switchRow: {
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  switchText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  switchLink: {
    ...Typography.bodySm,
    fontFamily: "Sora_700Bold",
    color: Colors.onSurface,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.outline + "33",
  },
  copyright: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  linksRow: {
    flexDirection: "row",
    gap: 24,
  },
  linkText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
  },
});

export default AuthFooter;
