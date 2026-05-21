import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MapPin, Clock, CheckCircle2, Circle, Camera, Navigation, ArrowLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import DashboardHeader from "@/components/shared/DashboardHeader";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { Colors, Typography } from "@/constants/design-tokens";

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

function ActiveJobContent() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Pressable
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.onSurface} />
        </Pressable>
        <Text style={s.headerTitle}>Active Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Map Placeholder */}
        <View style={s.mapPlaceholder}>
          <MapPin size={48} color={Colors.primaryContainer} strokeWidth={1.5} />
        </View>

        {/* Start Navigation Button */}
        <Pressable style={s.navBtn} accessibilityRole="button">
          <Text style={s.navBtnText}>Start Navigation</Text>
          <Navigation size={18} color={Colors.primaryContainer} />
        </Pressable>

        {/* Active Job Card */}
        <View style={s.card}>
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>In Progress</Text>
            </View>
            <Text style={s.jobTitle}>Fix AC Cooling Issue</Text>
          </View>

          {/* Details */}
          <View style={s.detailsSection}>
            <View style={s.detailRow}>
              <MapPin size={20} color={Colors.onSurfaceVariant} />
              <Text style={s.detailText}>G-13/4, House 12</Text>
            </View>
            <View style={s.detailRow}>
              <Clock size={20} color={Colors.onSurfaceVariant} />
              <Text style={s.detailText}>Today, 2:30 PM</Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={s.checklist}>
            <View style={s.checkRow}>
              <CheckCircle2 size={24} color={Colors.primary} fill={Colors.primary} />
              <Text style={s.checkText}>Accepted</Text>
            </View>
            <View style={s.checkRow}>
              <CheckCircle2 size={24} color={Colors.primary} fill={Colors.primary} />
              <Text style={s.checkText}>En-route to client</Text>
            </View>
            <View style={[s.checkRow, { opacity: 0.5 }]}>
              <Circle size={24} color={Colors.onSurfaceVariant} />
              <Text style={s.checkTextMuted}>Work in progress</Text>
            </View>
          </View>

          {/* Photo Upload */}
          <Pressable style={s.uploadBox} accessibilityRole="button">
            <Camera size={32} color={Colors.onSurfaceVariant} />
            <Text style={s.uploadText}>Upload Completion Photo{"\n"}(Required)</Text>
          </Pressable>

          {/* Complete Button */}
          <Pressable style={s.completeBtn} accessibilityRole="button">
            <Text style={s.completeBtnText}>Mark as Completed</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ActiveScreen() {
  return (
    <ErrorBoundary>
      <ActiveJobContent />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outline + "1A",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
  pageTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginTop: 8 },
  mapPlaceholder: {
    width: "100%", height: 160, backgroundColor: "#F2F2F2",
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  navBtn: {
    width: "100%", backgroundColor: Colors.onSurface, paddingVertical: 16,
    borderRadius: 8, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  navBtnText: { ...Typography.bodyMd, color: Colors.primaryContainer, fontWeight: "700" },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outline + "33",
    borderRadius: 12, padding: 24, gap: 16,
  },
  badgeRow: { gap: 8 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { ...Typography.labelMd, color: Colors.onPrimaryContainer },
  jobTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  detailsSection: {
    gap: 8, borderBottomWidth: 1,
    borderBottomColor: Colors.outline + "1A", paddingBottom: 16,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  checklist: { gap: 8, paddingVertical: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkText: { ...Typography.bodyMd, color: Colors.onSurface },
  checkTextMuted: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  uploadBox: {
    borderWidth: 2, borderStyle: "dashed", borderColor: Colors.outline + "4D",
    borderRadius: 8, padding: 32, alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  uploadText: {
    ...Typography.bodySm, color: Colors.onSurfaceVariant, textAlign: "center",
  },
  completeBtn: {
    width: "100%", backgroundColor: Colors.primaryContainer,
    paddingVertical: 16, borderRadius: 8, alignItems: "center",
  },
  completeBtnText: { ...Typography.labelMd, color: Colors.onPrimaryContainer },
});
