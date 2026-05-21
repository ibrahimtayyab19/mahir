import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, Lock } from "lucide-react-native";
import MahirHeader from "@/components/ui/MahirHeader";
import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import AuthFooter from "@/components/ui/AuthFooter";
import { Colors, Typography } from "@/constants/design-tokens";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { AxiosError } from "axios";

export default function Login() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const login = useAuthStore((state) => state.login);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = emailOrPhone.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async (): Promise<void> => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await authService.login(
        emailOrPhone.trim().toLowerCase(),
        password
      );

      // Save auth state to Zustand + AsyncStorage
      await login(
        result.token,
        result.user.id,
        result.user.name,
        result.user.role
      );

      // Navigate to the appropriate dashboard
      if (result.user.role === "provider") {
        router.replace("/(provider)");
      } else {
        router.replace("/(client)");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiMessage =
          (err.response?.data as { error?: string })?.error ??
          err.message;
        setErrorMessage(apiMessage);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Login failed — please try again"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <MahirHeader />
      <ScrollView style={s.sv} contentContainerStyle={s.svc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.main}>
          <View style={s.wrap}>
            <View style={s.hd}>
              <Text style={s.h1}>Welcome back</Text>
              <Text style={s.sub}>Log in to book trusted services or find local work nearby.</Text>
            </View>
            <View style={s.fields}>
              <FormInput icon={<Mail size={20} color={Colors.onSurfaceVariant} />} placeholder="Email or Phone Number" value={emailOrPhone} onChangeText={setEmailOrPhone} keyboardType="email-address" />
              <FormInput icon={<Lock size={20} color={Colors.onSurfaceVariant} />} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={s.errorWrap}>
                <Text style={s.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={s.forgot}>
              <Pressable accessibilityRole="link">
                <Text style={s.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
            <View style={s.cta}>
              {isSubmitting ? (
                <View style={s.loadingBtn}>
                  <ActivityIndicator size="small" color={Colors.onSurface} />
                  <Text style={s.loadingBtnText}>Logging in...</Text>
                </View>
              ) : (
                <PrimaryButton
                  title="LOG IN"
                  onPress={handleLogin}
                  disabled={!isFormValid}
                />
              )}
            </View>
            <AuthFooter mode="signup" showFullFooter={false} />
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.copy}>© 2026 Mahir.</Text>
          <View style={s.links}>
            <Pressable><Text style={s.link}>Terms of Service</Text></Pressable>
            <Pressable><Text style={s.link}>Privacy Policy</Text></Pressable>
            <Pressable><Text style={s.link}>Accessibility</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  sv: { flex: 1 }, svc: { flexGrow: 1 },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 24, alignItems: "center" },
  wrap: { width: "100%", maxWidth: 400 },
  hd: { alignItems: "center", marginBottom: 32 },
  h1: { ...Typography.headlineXlMobile, color: Colors.onSurface, letterSpacing: -0.5, textAlign: "center", marginBottom: 12 },
  sub: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: "center" },
  fields: { gap: 12 },
  errorWrap: {
    marginTop: 12,
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    textAlign: "center",
  },
  forgot: { alignItems: "flex-end", marginTop: 8 },
  forgotText: { ...Typography.labelMd, color: Colors.onSurfaceVariant, fontFamily: "Sora_600SemiBold" },
  cta: { marginTop: 24 },
  loadingBtn: {
    width: "100%",
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.primaryContainer,
    opacity: 0.8,
  },
  loadingBtnText: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontFamily: "Sora_700Bold",
  },
  socials: {},
  footer: { width: "100%", alignItems: "center", paddingVertical: 32, gap: 16, borderTopWidth: 1, borderTopColor: Colors.outline + "33" },
  copy: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  links: { flexDirection: "row", gap: 24 },
  link: { ...Typography.bodySm, color: Colors.onSurface },
});
