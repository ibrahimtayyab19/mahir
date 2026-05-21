import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Calendar, CreditCard, HelpCircle, LogOut, ChevronRight,
  User as UserIcon,
} from "lucide-react-native";
import DashboardHeader from "@/components/shared/DashboardHeader";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { Colors, Typography } from "@/constants/design-tokens";
import type { ProfileMenuItem } from "@/types";
import { useAuthStore } from "@/store/authStore";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

const MENU_ITEMS: ProfileMenuItem[] = [
  { id: "bookings", icon: "calendar", label: "My Bookings" },
  { id: "payment", icon: "credit_card", label: "Payment Methods" },
  { id: "help", icon: "help", label: "Help & Support" },
  { id: "logout", icon: "logout", label: "Log Out", isDestructive: true },
];

const IconMap: Record<string, React.FC<{ size: number; color: string }>> = {
  calendar: Calendar,
  credit_card: CreditCard,
  help: HelpCircle,
  logout: LogOut,
};

function ProfileContent() {
  const router = useRouter();
  const { userName, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is planned for v2.0 release.");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <DashboardHeader />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Profile</Text>

        {/* Profile Info Card */}
        <View style={s.profileCard}>
          <View style={s.avatarLg}>
            <UserIcon size={40} color={Colors.secondary} />
          </View>
          <Text style={s.profileName}>{userName || "Mahir User"}</Text>
          <Text style={s.profilePhone}>Client Account</Text>
          <Pressable 
            style={s.editBtn} 
            onPress={handleComingSoon}
            accessibilityRole="button"
          >
            <Text style={s.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Settings Menu */}
        <View style={s.menuSection}>
          {MENU_ITEMS.map((item) => {
            const Icon = IconMap[item.icon] || HelpCircle;
            const isDestructive = item.isDestructive;
            return (
              <Pressable
                key={item.id}
                style={[s.menuRow, isDestructive && s.menuRowDestructive]}
                onPress={isDestructive ? handleLogout : handleComingSoon}
                accessibilityRole="button"
              >
                <View style={s.menuLeft}>
                  <Icon
                    size={24}
                    color={isDestructive ? Colors.error : Colors.secondary}
                  />
                  <Text
                    style={[
                      s.menuLabel,
                      isDestructive && { color: Colors.error },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={Colors.outlineVariant}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, paddingBottom: 120, gap: 24 },
  pageTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outline + "26",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  avatarLg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.outline + "1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileName: { ...Typography.headlineSm, color: Colors.onSurface },
  profilePhone: { ...Typography.bodySm, color: Colors.tertiary },
  editBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: 4,
  },
  editBtnText: { ...Typography.labelMd, color: Colors.secondary },
  menuSection: { width: "100%" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outline + "1A",
  },
  menuRowDestructive: { marginTop: 16 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  menuLabel: { ...Typography.bodyMd, color: Colors.onSurface },
});
