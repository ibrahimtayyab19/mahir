import React, { useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Zap, MapPin, Wallet, SlidersHorizontal, Star, Navigation } from "lucide-react-native";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorBoundaryFallback from "@/components/shared/ErrorBoundaryFallback";
import { Colors, Typography } from "@/constants/design-tokens";
import type { ProviderJob } from "@/types";

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

// ── Provider Job Card Component ──
function ProviderJobCard({ job }: { job: ProviderJob }) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptJob = () => {
    if (isAccepting) return;

    Alert.alert(
      "Accept Job",
      `Are you sure you want to accept this "${job.title}" job?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          onPress: async () => {
            setIsAccepting(true);
            try {
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 1500));
              Alert.alert("Success", "Job accepted! Navigating to job details... (Planned for v1.1)");
            } catch (err) {
              Alert.alert("Error", "Failed to accept job. Please try again.");
            } finally {
              setIsAccepting(false);
            }
          }
        },
      ]
    );
  };

  return (
    <View style={s.card}>
      {/* AI Agent Badge */}
      <View style={s.cardMeta}>
        <Zap size={14} color={Colors.secondary} />
        <Text style={s.cardMetaText}>
          {job.generatedBy} • {job.timeAgo}
        </Text>
      </View>

      {/* Title */}
      <Text style={s.cardTitle}>{job.title}</Text>

      {/* Location, Price, Distance, Rating */}
      <View style={s.cardDetails}>
        <View style={s.detailChip}>
          <MapPin size={16} color={Colors.secondary} />
          <Text style={s.detailText}>{job.location}</Text>
        </View>
        <View style={s.detailChip}>
          <Wallet size={16} color={Colors.secondary} />
          <Text style={s.detailText}>{job.estimatedPrice}</Text>
        </View>
        <View style={s.detailChip}>
          <Navigation size={16} color={Colors.secondary} />
          <Text style={s.detailText}>{job.distance}</Text>
        </View>
        <View style={s.detailChip}>
          <Star size={16} color={Colors.secondary} fill={Colors.secondary} />
          <Text style={s.detailText}>{job.clientRating}</Text>
        </View>
      </View>

      {/* AI Summary Box */}
      <View style={s.aiBox}>
        <Text style={s.aiText}>{job.aiSummary}</Text>
      </View>

      {/* Accept Job CTA */}
      <Pressable 
        style={[s.acceptBtn, isAccepting && { opacity: 0.7 }]} 
        onPress={handleAcceptJob}
        disabled={isAccepting}
        accessibilityRole="button"
      >
        {isAccepting ? (
          <ActivityIndicator size="small" color={Colors.onSurface} />
        ) : (
          <Text style={s.acceptBtnText}>Accept Job</Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Main Screen ──
function ProviderJobsContent() {
  const { jobs, isLoading, error } = useProviderJobs();

  if (error) throw error;

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Available Jobs</Text>
            <Text style={s.headerSub}>Real-time requests in your area</Text>
          </View>
        </View>
        <LoadingSkeleton type="list" />
      </SafeAreaView>
    );
  }

  const handleFilterPress = () => {
    Alert.alert("Filters", "Filter functionality is coming soon in v2.0.");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Available Jobs</Text>
          <Text style={s.headerSub}>Real-time requests in your area</Text>
        </View>
        <Pressable 
          style={s.filterBtn} 
          onPress={handleFilterPress}
          accessibilityRole="button" 
          accessibilityLabel="Filter"
        >
          <SlidersHorizontal size={20} color={Colors.onSurface} />
        </Pressable>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProviderJobCard job={item} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        windowSize={7}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>No jobs available in your area right now.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default function ProviderJobsScreen() {
  return (
    <ErrorBoundary>
      <ProviderJobsContent />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  headerSub: { ...Typography.bodySm, color: Colors.secondary, marginTop: 4 },
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    alignItems: "center", justifyContent: "center",
  },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.secondary + "4D",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMetaText: { ...Typography.labelSm, color: Colors.secondary },
  cardTitle: { ...Typography.headlineSm, color: Colors.onSurface, fontWeight: "700" },
  cardDetails: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 4 },
  detailChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { ...Typography.bodySm, color: Colors.secondary },
  aiBox: {
    backgroundColor: Colors.surfaceContainerHighest + "80",
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.secondary + "1A",
  },
  aiText: { ...Typography.bodySm, color: Colors.onSurface },
  acceptBtn: {
    width: "100%",
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  acceptBtnText: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: "700" },
});
