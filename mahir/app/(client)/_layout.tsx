import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Home, MessageCircle, User } from "lucide-react-native";
import { Colors, Typography } from "@/constants/design-tokens";

/**
 * Client Route Group Layout.
 * Renders the Bottom Navigation Bar for authenticated clients.
 */
export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.onSurface,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Home size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat AI",
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <MessageCircle size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="active" options={{ href: null }} />
      <Tabs.Screen name="processing" options={{ href: null }} />
      <Tabs.Screen name="results" options={{ href: null }} />
      <Tabs.Screen name="booking" options={{ href: null }} />
      <Tabs.Screen name="agent-logs" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + "4D",
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 12,
    position: "absolute",
    elevation: 0,
  },
  tabLabel: {
    ...Typography.labelMd,
    marginTop: 4,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    backgroundColor: Colors.primaryContainer,
  },
});
