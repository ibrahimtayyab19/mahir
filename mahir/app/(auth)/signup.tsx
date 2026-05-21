import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Monitor } from "lucide-react-native";
import MahirHeader from "@/components/ui/MahirHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import AuthFooter from "@/components/ui/AuthFooter";
import { Colors, Typography } from "@/constants/design-tokens";
import { useAuthStore } from "@/store/authStore";

/**
 * Screen 1: Signup Selection
 * User picks their role (Client or Provider) before proceeding.
 * Role selection stored globally in Zustand authStore.
 */
export default function SignupSelection() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);

  const handleCreateAccount = () => {
    if (role === "client") {
      router.push("/(auth)/signup-client");
    } else {
      router.push("/(auth)/signup-provider");
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <MahirHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.main}>
          <View style={styles.contentWrapper}>
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>Join Mahir</Text>
              <Text style={styles.subtitle}>
                Sign up to hire trusted local professionals or offer
                your services to customers nearby.
              </Text>
            </View>

            {/* Role Cards */}
            <View style={styles.cardsContainer}>
              <RoleCard
                selected={role === "client"}
                onPress={() => setRole("client")}
                icon={<Search size={40} color={Colors.onSurface} />}
                title="I need a service done"
                description="Book verified AC technicians, plumbers, electricians, and more with a single voice note or message."
              />
              <RoleCard
                selected={role === "provider"}
                onPress={() => setRole("provider")}
                icon={<Monitor size={40} color={Colors.onSurface} />}
                title="I am a Mahir, looking for work"
                description="Register your skills, get matched with local jobs instantly, and grow your daily income."
              />
            </View>

            {/* CTA Button */}
            <View style={styles.ctaContainer}>
              <PrimaryButton
                title="Create Account"
                onPress={handleCreateAccount}
              />
            </View>
          </View>
        </View>

        <AuthFooter mode="login" showFullFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Role Card Sub-component ──

interface RoleCardProps {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function RoleCard({ selected, onPress, icon, title, description }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? Colors.onSurface : Colors.outline + "66",
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.cardTopRow}>
        <View>{icon}</View>
        <View
          style={[
            styles.radioOuter,
            {
              borderColor: selected ? Colors.onSurface : Colors.outline + "99",
            },
          ]}
        >
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 480,
  },
  headingContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  heading: {
    ...Typography.headlineXlMobile,
    color: Colors.onSurface,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 320,
    marginTop: 8,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  ctaContainer: {
    marginTop: 16,
  },
  loginLink: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  // Role Card styles
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    overflow: "hidden",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.onSurface,
  },
  cardTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  cardDescription: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
});
