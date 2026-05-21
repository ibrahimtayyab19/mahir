import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Colors } from "@/constants/design-tokens";
import type { LoadingSkeletonProps } from "@/types";

/**
 * Animated Loading Skeleton for graceful degradation during network latency.
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  if (type === "dashboard") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Animated.View style={[styles.shimmer, styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.shimmer, styles.subtitleSkeleton, { opacity }]} />
        </View>
        <View style={styles.cardsRow}>
          <Animated.View style={[styles.shimmer, styles.cardSkeleton, { opacity }]} />
          <Animated.View style={[styles.shimmer, styles.cardSkeleton, { opacity }]} />
        </View>
        <View style={styles.voiceSection}>
          <Animated.View style={[styles.shimmer, styles.voiceSkeleton, { opacity }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.shimmer, styles.listItem, { opacity }]} />
      <Animated.View style={[styles.shimmer, styles.listItem, { opacity }]} />
      <Animated.View style={[styles.shimmer, styles.listItem, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  shimmer: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8,
  },
  header: {
    marginBottom: 32,
  },
  titleSkeleton: {
    height: 32,
    width: "60%",
    marginBottom: 8,
  },
  subtitleSkeleton: {
    height: 20,
    width: "40%",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },
  cardSkeleton: {
    height: 140,
    width: 256,
    borderRadius: 12,
  },
  voiceSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  voiceSkeleton: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  listItem: {
    height: 80,
    width: "100%",
    marginBottom: 12,
    borderRadius: 12,
  },
});

export default LoadingSkeleton;
