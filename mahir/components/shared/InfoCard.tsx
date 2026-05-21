import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors, Typography } from "@/constants/design-tokens";
import type { DashboardMetric } from "@/types";
import {
  ThermometerSnowflake,
  Wrench,
  Zap,
  MapPin,
  Calendar,
  Wallet,
  LucideIcon,
  HelpCircle,
} from "lucide-react-native";

interface InfoCardProps {
  metric: DashboardMetric;
  onPress?: (id: string) => void;
}

// Map string icon names to Lucide components
const IconMap: Record<string, LucideIcon> = {
  ac_unit: ThermometerSnowflake,
  plumbing: Wrench,
  electric_bolt: Zap,
  location_on: MapPin,
  calendar_today: Calendar,
  account_balance_wallet: Wallet,
};

/**
 * Horizontal scrollable card for dashboards.
 * Displays an icon, title, and subtitle. Changes styling if marked urgent.
 */
export const InfoCard: React.FC<InfoCardProps> = ({ metric, onPress }) => {
  const IconComponent = IconMap[metric.icon] || HelpCircle;

  const isUrgent = metric.isUrgent;
  
  // Dynamic styles based on urgency
  const iconContainerBg = isUrgent ? Colors.errorContainer : Colors.primaryContainer + "33"; // 20% opacity
  const iconColor = isUrgent ? Colors.error : Colors.onSurface;
  const subtitleColor = isUrgent ? Colors.error : Colors.onSurfaceVariant;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress?.(metric.id)}
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: iconContainerBg }]}>
        <IconComponent size={28} color={iconColor} strokeWidth={1.5} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {metric.title}
      </Text>
      <View style={styles.subtitleRow}>
        <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
          {metric.subtitle}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 256, // 64 * 4
    flexDirection: "column",
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.secondary + "1A", // 10% opacity
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    ...Typography.bodySm,
  },
});

export default InfoCard;
