import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Star,
  CheckCircle,
  MapPin,
  Clock,
  AlertCircle,
  Search,
  ArrowLeft,
} from "lucide-react-native";
import { Colors, Typography, Radii, Spacing } from "@/constants/design-tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchFactors {
  distance: number;
  rating: number;
  onTime: number;
  specialization: number;
  cancellationRate: number;
  sentiment: number;
}

interface ProviderMatch {
  providerId: string;
  name: string;
  score: number;
  distanceKm: number;
  estimatedArrivalMins: number;
  rating: number;
  priceEstimate: number;
  verifiedBadge: boolean;
  reasoning: string;
  matchFactors: MatchFactors;
}

interface ParsedIntent {
  serviceType: string;
  location: { area: string; city: string };
  urgency: string;
  preferredTime: string;
  jobPost: { english: string; urdu: string; romanUrdu: string };
  reasoning: string;
}

interface FallbackData {
  reason: string;
  suggestion: string;
}

// ─── Match Factor Labels ──────────────────────────────────────────────────────

const FACTOR_LABELS: { key: keyof MatchFactors; label: string }[] = [
  { key: "distance", label: "Distance" },
  { key: "rating", label: "Rating" },
  { key: "onTime", label: "On-Time" },
  { key: "specialization", label: "Specialization" },
  { key: "cancellationRate", label: "Low Cancellation" },
  { key: "sentiment", label: "Sentiment" },
];

// ─── Urgency Colors ───────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: Colors.primaryContainer, text: Colors.onPrimaryContainer },
  medium: { bg: "#FFF3E0", text: "#E65100" },
  high: { bg: Colors.errorContainer, text: Colors.onErrorContainer },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    jobPostId: string;
    matchesJson: string;
    parsedIntentJson: string;
    fallbackJson: string;
  }>();

  // ── Parse JSON Params ─────────────────────────────────────────────────────

  const matches = useMemo<ProviderMatch[]>(() => {
    try {
      return JSON.parse(params.matchesJson ?? "[]") as ProviderMatch[];
    } catch {
      return [];
    }
  }, [params.matchesJson]);

  const parsedIntent = useMemo<ParsedIntent | null>(() => {
    try {
      return JSON.parse(params.parsedIntentJson ?? "null") as ParsedIntent | null;
    } catch {
      return null;
    }
  }, [params.parsedIntentJson]);

  const fallback = useMemo<FallbackData | null>(() => {
    try {
      return JSON.parse(params.fallbackJson ?? "null") as FallbackData | null;
    } catch {
      return null;
    }
  }, [params.fallbackJson]);

  const urgencyStyle =
    URGENCY_STYLES[parsedIntent?.urgency ?? "low"] ?? URGENCY_STYLES["low"];

  // ── Handle Book ──────────────────────────────────────────────────────────

  const handleBook = (match: ProviderMatch) => {
    router.push({
      pathname: "/(client)/booking",
      params: {
        sessionId: params.sessionId ?? "",
        jobPostId: params.jobPostId ?? "",
        providerId: match.providerId,
        providerName: match.name,
        priceEstimate: String(match.priceEstimate),
        matchScore: String(match.score),
      },
    });
  };

  // ── Fallback UI — No Providers ────────────────────────────────────────────

  if (matches.length === 0 && fallback) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.fallbackContainer}>
          <View style={styles.fallbackIconWrap}>
            <AlertCircle size={56} color={Colors.error} />
          </View>
          <Text style={styles.fallbackTitle}>Koi expert nahi mila</Text>
          <Text style={styles.fallbackReason}>{fallback.reason}</Text>
          <Text style={styles.fallbackSuggestion}>{fallback.suggestion}</Text>

          <View style={styles.fallbackActions}>
            <Pressable
              style={styles.fallbackBtnPrimary}
              onPress={() => router.replace("/(client)/")}
              accessibilityRole="button"
            >
              <Search size={18} color={Colors.onPrimaryContainer} />
              <Text style={styles.fallbackBtnPrimaryText}>Expand Search</Text>
            </Pressable>
            <Pressable
              style={styles.fallbackBtnSecondary}
              onPress={() => router.replace("/(client)/")}
              accessibilityRole="button"
            >
              <Text style={styles.fallbackBtnSecondaryText}>
                Try Different Service
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Results UI ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header / Back */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Matched Experts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Parsed Intent Summary */}
        {parsedIntent && (
          <View style={styles.intentCard}>
            <Text style={styles.intentLabel}>Request parsed:</Text>
            <Text style={styles.intentService}>
              {parsedIntent.serviceType}
            </Text>
            <View style={styles.intentMeta}>
              <View style={styles.intentChip}>
                <MapPin size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.intentChipText}>
                  {parsedIntent.location.area}, {parsedIntent.location.city}
                </Text>
              </View>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: urgencyStyle?.bg },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyText,
                    { color: urgencyStyle?.text },
                  ]}
                >
                  {parsedIntent.urgency.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Provider Cards */}
        {matches.map((match, idx) => (
          <View key={match.providerId} style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.providerName}>{match.name}</Text>
                <View style={styles.badges}>
                  {match.verifiedBadge && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle size={14} color="#4CAF50" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreText}>
                  {match.score.toFixed(1)} match
                </Text>
              </View>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={14} color="#FFC107" />
                <Text style={styles.statText}>{match.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.statItem}>
                <MapPin size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.statText}>
                  {match.distanceKm.toFixed(1)} km away
                </Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.statText}>
                  ~{match.estimatedArrivalMins} min
                </Text>
              </View>
            </View>

            {/* Price */}
            <Text style={styles.priceText}>
              PKR {match.priceEstimate.toLocaleString()}/hr
            </Text>

            {/* AI Reasoning */}
            <View style={styles.reasoningWrap}>
              <Text style={styles.reasoningLabel}>AI Reasoning:</Text>
              <Text style={styles.reasoningText}>{match.reasoning}</Text>
            </View>

            {/* Match Factor Bars */}
            <View style={styles.factorsContainer}>
              {FACTOR_LABELS.map(({ key, label }) => {
                const value = match.matchFactors[key];
                return (
                  <View key={key} style={styles.factorRow}>
                    <Text style={styles.factorLabel}>{label}</Text>
                    <View style={styles.factorBarBg}>
                      <View
                        style={[
                          styles.factorBarFill,
                          { width: `${Math.min(value * 100, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.factorValue}>{value.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.callButton}
                onPress={() => Linking.openURL("tel:+923001234567")}
                accessibilityRole="button"
              >
                <Text style={styles.callButtonText}>Call</Text>
              </Pressable>

              <Pressable
                style={styles.bookButton}
                onPress={() => handleBook(match)}
                accessibilityRole="button"
              >
                <Text style={styles.bookButtonText}>Book</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
    gap: 8,
  },
  // ── Intent Summary ───────────────────────────────────────────────
  intentCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.md,
    padding: 16,
    marginBottom: 8,
  },
  intentLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  intentService: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  intentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  intentChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  urgencyText: {
    ...Typography.labelMd,
    fontSize: 11,
  },
  // ── Provider Card ────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  providerName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    ...Typography.labelSm,
    color: "#4CAF50",
  },
  scoreChip: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  scoreText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
  },
  // ── Stats Row ────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  priceText: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
    marginBottom: 12,
  },
  // ── AI Reasoning ─────────────────────────────────────────────────
  reasoningWrap: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.default,
    padding: 12,
    marginBottom: 12,
  },
  reasoningLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  reasoningText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: "italic",
    lineHeight: 20,
  },
  // ── Match Factor Bars ────────────────────────────────────────────
  factorsContainer: {
    gap: 6,
    marginBottom: 16,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  factorLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    width: 100,
  },
  factorBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: "hidden",
  },
  factorBarFill: {
    height: 6,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 3,
  },
  factorValue: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    width: 34,
    textAlign: "right",
  },
  // ── Actions Row ──────────────────────────────────────────────────
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  callButton: {
    backgroundColor: Colors.surfaceContainerHigh,
    height: 52,
    flex: 0.3,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonText: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontFamily: "Sora_700Bold",
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: Colors.primaryContainer,
    height: 52,
    flex: 0.7,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  // ── Fallback UI ──────────────────────────────────────────────────
  emptyWrap: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
    marginTop: 24,
    gap: 16,
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radii.default,
  },
  retryBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  fallbackIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.errorContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  fallbackTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 12,
    textAlign: "center",
  },
  fallbackReason: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 8,
  },
  fallbackSuggestion: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
  },
  fallbackActions: {
    width: "100%",
    gap: 12,
  },
  fallbackBtnPrimary: {
    flexDirection: "row",
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: Radii.default,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackBtnPrimaryText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontFamily: "Sora_700Bold",
  },
  fallbackBtnSecondary: {
    height: 52,
    borderRadius: Radii.default,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackBtnSecondaryText: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
});

