import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Clock,
  Bell,
} from "lucide-react-native";
import { Colors, Typography, Radii, Spacing } from "@/constants/design-tokens";
import apiClient from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoterPricing {
  baseFee: number;
  distanceCharge: number;
  urgencySurge: number;
  peakHourCharge: number;
  total: number;
  currency: string;
  breakdown: string;
}

interface QuoterConfirmation {
  toClient: { english: string; romanUrdu: string };
  toProvider: { english: string; romanUrdu: string };
}

interface QuoterFollowUp {
  reminderAt: string;
  checkInAt: string;
  feedbackRequestAt: string;
}

interface SelectResponse {
  success: boolean;
  data: {
    bookingId: string;
    pricing: QuoterPricing;
    bookingSlot: string;
    confirmation: QuoterConfirmation;
    simulatedSMS: string;
    followUpSchedule: QuoterFollowUp;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    jobPostId: string;
    providerId: string;
    providerName: string;
    priceEstimate: string;
    matchScore: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<SelectResponse["data"] | null>(null);

  // ── API Call ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const confirmBooking = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: response } = await apiClient.post<SelectResponse>(
          "/api/client/select",
          {
            sessionId: params.sessionId ?? "",
            jobPostId: params.jobPostId ?? "",
            providerId: params.providerId ?? "",
          }
        );

        setBookingData(response.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Booking failed — try again";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    confirmBooking();
  }, [params.sessionId, params.jobPostId, params.providerId]);

  // ── Loading State ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={Colors.onPrimaryContainer} />
          </View>
          <Text style={styles.loadingTitle}>Calculating your quote...</Text>
          <Text style={styles.loadingSubtitle}>
            Our pricing agent is analyzing rates, distance, and urgency
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <AlertCircle size={48} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Booking Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try Another Provider</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingData) return null;

  const { pricing, bookingSlot, confirmation, simulatedSMS, followUpSchedule } =
    bookingData;

  // ── Success State ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Confirmed Banner */}
        <View style={styles.confirmedBanner}>
          <CheckCircle size={28} color="#4CAF50" />
          <Text style={styles.confirmedText}>Booking Confirmed ✓</Text>
        </View>

        {/* Provider + Match */}
        <View style={styles.providerCard}>
          <Text style={styles.providerName}>
            {params.providerName ?? "Provider"}
          </Text>
          <View style={styles.matchChip}>
            <Text style={styles.matchChipText}>
              {Number(params.matchScore ?? "0").toFixed(1)} match
            </Text>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>

          <PricingRow label="Base Fee" amount={pricing.baseFee} />
          <PricingRow label="Distance Charge" amount={pricing.distanceCharge} />
          <PricingRow label="Urgency Surge" amount={pricing.urgencySurge} />
          <PricingRow label="Peak Hour" amount={pricing.peakHourCharge} />

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalAmount}>
              PKR {pricing.total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Booking Slot */}
        <View style={styles.slotCard}>
          <Clock size={18} color={Colors.onSurfaceVariant} />
          <View style={styles.slotTextWrap}>
            <Text style={styles.slotLabel}>Booking Slot</Text>
            <Text style={styles.slotValue}>{bookingSlot}</Text>
          </View>
        </View>

        {/* Confirmation Message (Roman Urdu) */}
        <View style={styles.confirmationCard}>
          <Text style={styles.sectionTitle}>Confirmation</Text>
          <Text style={styles.confirmationRoman}>
            {confirmation.toClient.romanUrdu}
          </Text>
          <Text style={styles.confirmationEnglish}>
            {confirmation.toClient.english}
          </Text>
        </View>

        {/* Simulated SMS */}
        <View style={styles.smsCard}>
          <View style={styles.smsHeader}>
            <MessageSquare size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.smsHeaderText}>Simulated SMS Preview</Text>
          </View>
          <Text style={styles.smsText}>{simulatedSMS}</Text>
        </View>

        {/* Follow-Up Schedule */}
        <View style={styles.followUpCard}>
          <Text style={styles.sectionTitle}>Follow-Up Schedule</Text>

          <FollowUpItem
            icon={<Bell size={14} color={Colors.onSurfaceVariant} />}
            label="Reminder sent at"
            value={followUpSchedule.reminderAt}
          />
          <FollowUpItem
            icon={<Clock size={14} color={Colors.onSurfaceVariant} />}
            label="Check-in"
            value={followUpSchedule.checkInAt}
          />
          <FollowUpItem
            icon={<Star size={14} color={Colors.onSurfaceVariant} />}
            label="Feedback request"
            value={followUpSchedule.feedbackRequestAt}
          />
        </View>

        {/* Done Button */}
        <Pressable
          style={styles.doneButton}
          onPress={() => router.replace("/(client)/")}
          accessibilityRole="button"
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function PricingRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.pricingRow}>
      <Text style={styles.pricingLabel}>{label}</Text>
      <Text style={styles.pricingAmount}>PKR {amount.toLocaleString()}</Text>
    </View>
  );
}

function FollowUpItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.followUpRow}>
      {icon}
      <Text style={styles.followUpLabel}>{label}:</Text>
      <Text style={styles.followUpValue}>{value}</Text>
    </View>
  );
}

// Star icon used in follow-up (defined locally to avoid extra import complexity)
function Star({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  // Using a simple circle as placeholder for the star icon
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "33",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: (size * 0.5) / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + "4D",
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: 16,
    gap: 12,
  },
  // ── Confirmed Banner ─────────────────────────────────────────────
  confirmedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    paddingVertical: 16,
    borderRadius: Radii.md,
  },
  confirmedText: {
    ...Typography.headlineSm,
    color: "#2E7D32",
  },
  // ── Provider Card ────────────────────────────────────────────────
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: Radii.md,
    padding: 16,
  },
  providerName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  matchChip: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  matchChipText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
  },
  // ── Pricing Card ─────────────────────────────────────────────────
  pricingCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: Radii.md,
    padding: 16,
  },
  sectionTitle: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pricingLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  pricingAmount: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant + "66",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  totalAmount: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontFamily: "Sora_700Bold",
  },
  // ── Slot Card ────────────────────────────────────────────────────
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.md,
    padding: 16,
  },
  slotTextWrap: {
    flex: 1,
  },
  slotLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  slotValue: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
  },
  // ── Confirmation Card ────────────────────────────────────────────
  confirmationCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: Radii.md,
    padding: 16,
  },
  confirmationRoman: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
    marginBottom: 8,
    lineHeight: 24,
  },
  confirmationEnglish: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  // ── SMS Card ─────────────────────────────────────────────────────
  smsCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radii.md,
    padding: 16,
  },
  smsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  smsHeaderText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  smsText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    lineHeight: 20,
    fontFamily: "Sora_400Regular",
  },
  // ── Follow-Up Card ───────────────────────────────────────────────
  followUpCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: Radii.md,
    padding: 16,
  },
  followUpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  followUpLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  followUpValue: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
    flex: 1,
  },
  // ── Done Button ──────────────────────────────────────────────────
  doneButton: {
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  doneButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  // ── Loading ──────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  loadingSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  // ── Error ────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  errorMessage: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radii.default,
  },
  retryText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
  },
});
