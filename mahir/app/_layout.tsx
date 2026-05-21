import React, { useEffect } from "react";
import { Slot, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "@expo-google-fonts/sora";
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from "@expo-google-fonts/sora";

// Prevent splash screen from auto-hiding until fonts load
SplashScreen.preventAutoHideAsync();

/**
 * Root layout — loads Sora font family.
 * NativeWind CSS import removed due to Node v24 + lightningcss
 * ABI incompatibility. All styling uses StyleSheet + design tokens.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}
