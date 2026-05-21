import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@/constants/design-tokens";

/**
 * Horizontal divider with centered "OR" text.
 * Line color: outline at 30% opacity.
 */
const OrDivider: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.line} />
    <Text style={styles.text}>OR</Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outline + "4D",
  },
  text: {
    marginHorizontal: 16,
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
});

export default OrDivider;
