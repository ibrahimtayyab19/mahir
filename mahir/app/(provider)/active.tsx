import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MapPin, Clock, CheckCircle2, Circle, Camera, Navigation, Wallet,
} from "lucide-react-native";
import DashboardHeader from "@/components/shared/DashboardHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { useProviderActiveJob } from "@/hooks/useProviderActiveJob";
import { Colors, Typography } from "@/constants/design-tokens";
import type { ChecklistStep } from "@/types";

// ── Error Boundary ──
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

// ── Checklist Step Component ──
function ChecklistItem({ step }: { step: ChecklistStep }) {
  const isCompleted = step.status === "completed";
  const isPending = step.status === "pending";

  return (
    <View style={[s.checkRow, isPending && { opacity: 0.5 }]}>
      {isCompleted ? (
        <CheckCircle2 size={24} color={Colors.primary} fill={Colors.primary} />
      ) : (
        <Circle size={24} color={Colors.onSurfaceVariant} />
      )}
      <Text style={isCompleted ? s.checkText : s.checkTextMuted}>
        {step.label}
      </Text>
    </View>
  );
}

// ── Main Screen ──
function ActiveJobContent() {
  const { activeJob, isLoading: isDataLoading, error } = useProviderActiveJob();
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  if (error) throw error;

  if (isDataLoading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <DashboardHeader />
        <View style={s.titleWrap}>
          <Text style={s.pageTitle}>Active Job</Text>
        </View>
        <LoadingSkeleton type="dashboard" />
      </SafeAreaView>
    );
  }

  if (!activeJob) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <DashboardHeader />
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No Active Job</Text>
          <Text style={s.emptySub}>Accept a job from the Jobs tab to get started.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAction = async (actionLabel: string, successMsg: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Success", successMsg);
    } catch (err) {
      Alert.alert("Error", "Action failed. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <DashboardHeader />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Active Job</Text>

        {/* Map Placeholder */}
        <View style={s.mapPlaceholder}>
          <MapPin size={48} color={Colors.primaryContainer} strokeWidth={1.5} />
        </View>

        {/* Start Navigation Button */}
        <Pressable 
          style={[s.navBtn, isActionLoading && { opacity: 0.7 }]} 
          onPress={() => handleAction("Navigation", "Google Maps will open shortly...")}
          disabled={isActionLoading}
          accessibilityRole="button"
        >
          <Text style={s.navBtnText}>Start Navigation</Text>
          {isActionLoading ? (
            <ActivityIndicator size="small" color={Colors.primaryContainer} />
          ) : (
            <Navigation size={18} color={Colors.primaryContainer} />
          )}
        </Pressable>

        {/* Active Job Card */}
        <View style={s.card}>
          {/* Badge & Title */}
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>In Progress</Text>
            </View>
            <Text style={s.jobTitle}>{activeJob.title}</Text>
          </View>

          {/* Details */}
          <View style={s.detailsSection}>
            <View style={s.detailRow}>
              <MapPin size={20} color={Colors.onSurfaceVariant} />
              <Text style={s.detailText}>{activeJob.location}</Text>
            </View>
            <View style={s.detailRow}>
              <Clock size={20} color={Colors.onSurfaceVariant} />
              <Text style={s.detailText}>{activeJob.scheduledTime}</Text>
            </View>
            <View style={s.detailRow}>
              <Wallet size={20} color={Colors.onSurfaceVariant} />
              <Text style={s.detailText}>{activeJob.estimatedEarnings}</Text>
            </View>
          </View>

          {/* 3-Step Checklist */}
          <View style={s.checklist}>
            {activeJob.checklist.map((step) => (
              <ChecklistItem key={step.id} step={step} />
            ))}
          </View>

          {/* Photo Upload */}
          <Pressable 
            style={[s.uploadBox, isActionLoading && { opacity: 0.7 }]} 
            onPress={() => handleAction("Upload", "Photo uploaded successfully.")}
            disabled={isActionLoading}
            accessibilityRole="button"
          >
            <Camera size={32} color={Colors.onSurfaceVariant} />
            <Text style={s.uploadText}>
              Upload Completion Photo{"\n"}(Required)
            </Text>
          </Pressable>

          {/* Complete Button */}
          <Pressable 
            style={[s.completeBtn, isActionLoading && { opacity: 0.7 }]} 
            onPress={() => handleAction("Complete", "Job marked as completed! Payment is being processed.")}
            disabled={isActionLoading}
            accessibilityRole="button"
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color={Colors.onPrimaryContainer} />
            ) : (
              <Text style={s.completeBtnText}>Mark as Completed</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProviderActiveScreen() {
  return (
    <ErrorBoundary>
      <ActiveJobContent />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  titleWrap: { paddingHorizontal: 16, paddingTop: 8 },
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
  pageTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32,
  },
  emptyTitle: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: 8 },
  emptySub: { ...Typography.bodySm, color: Colors.secondary, textAlign: "center" },
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
