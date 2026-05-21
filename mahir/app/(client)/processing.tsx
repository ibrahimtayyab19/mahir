import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { Colors, Typography, Radii } from "@/constants/design-tokens";
import apiClient from "@/services/api";

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

interface RequestResponse {
  success: boolean;
  data: {
    sessionId: string;
    jobPostId: string;
    parsedIntent: ParsedIntent;
    matches: ProviderMatch[];
    totalSearched: number;
    searchRadiusKm: number;
    fallback: FallbackData | null;
  };
}

import { MOCK_REASONING_STEPS } from "@/constants/mockData";

// ─── Reasoning Steps (Initial Placeholders) ───────────────────────────────────

const INITIAL_STEPS = MOCK_REASONING_STEPS;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    message: string;
    latitude: string;
    longitude: string;
  }>();

  const [steps, setSteps] = useState<string[]>([...INITIAL_STEPS]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation refs for steps
  const stepOpacities = useRef(
    INITIAL_STEPS.map(() => new Animated.Value(0))
  ).current;

  // Pulsing animation for the center circle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulse loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // ── Reveal Animation ──────────────────────────────────────────────────────

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setCurrentStep(idx);
        const anim = stepOpacities[idx];
        if (anim) {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      }, idx * 1000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [steps, stepOpacities]);

  // ── Real API Call ─────────────────────────────────────────────────────────

  useEffect(() => {
    const callOrchestrator = async (): Promise<void> => {
      try {
        const startTime = Date.now();
        const { data: response } = await apiClient.post<any>(
          "/api/client/request",
          {
            rawMessage: params.message ?? "",
            latitude: Number(params.latitude ?? "33.6844"),
            longitude: Number(params.longitude ?? "72.9774"),
          }
        );

        if (!response.success) throw new Error(response.message || "Request failed");

        const result = response.data;
        
        // If we have real traces, we could update the steps here, 
        // but for a smooth transition, we ensure the animation has 
        // played for at least a few seconds.
        const elapsed = Date.now() - startTime;
        const remainingWait = Math.max(0, 3000 - elapsed);
        
        await new Promise((resolve) => setTimeout(resolve, remainingWait));

        // Navigate to results with REAL data
        router.replace({
          pathname: "/(client)/results",
          params: {
            sessionId: result.sessionId,
            jobPostId: result.jobPostId,
            matchesJson: JSON.stringify(result.matches),
            parsedIntentJson: JSON.stringify(result.parsedIntent),
            fallbackJson: JSON.stringify(result.fallback),
            // We can also pass traces if results screen wants to show them
            agentTracesJson: JSON.stringify(result.agentTraces),
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Orchestrator failed";
        setError(message);
        setIsLoading(false);
      }
    };

    callOrchestrator();
  }, [params.message, params.latitude, params.longitude, router]);

  // ── Error State ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <AlertCircle size={48} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading / Processing State ────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Mahir is finding your expert...</Text>

        {/* Pulsing Circle */}
        <View style={styles.pulseWrapper}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {isLoading && (
              <ActivityIndicator size="small" color={Colors.onPrimaryContainer} />
            )}
          </Animated.View>
        </View>

        {/* Reasoning Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const opacity = stepOpacities[idx];
            if (!opacity) return null;
            const isActive = idx === currentStep;

            return (
              <Animated.View
                key={step}
                style={[styles.stepRow, { opacity }]}
              >
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isActive
                        ? Colors.primary
                        : Colors.primaryContainer,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.stepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    textAlign: "center",
    marginBottom: 40,
  },
  pulseWrapper: {
    marginBottom: 48,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsContainer: {
    width: "100%",
    maxWidth: 340,
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  stepTextActive: {
    ...Typography.bodySm,
    fontFamily: "Sora_600SemiBold",
    color: Colors.onSurface,
  },
  // Error state
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
