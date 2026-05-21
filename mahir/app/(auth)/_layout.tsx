import { Stack } from "expo-router";

/**
 * Auth group layout — hides the default header since
 * each screen uses the custom MahirHeader component.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F9FAF2" },
        animation: "slide_from_right",
      }}
    />
  );
}
