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
import { User, Smartphone, Lock, Mail } from "lucide-react-native";
import MahirHeader from "@/components/ui/MahirHeader";
import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import AuthFooter from "@/components/ui/AuthFooter";
import { Colors, Typography } from "@/constants/design-tokens";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { AxiosError } from "axios";

/**
 * Screen 2: Client Signup Form
 * "Create your account" — for customers who want to book services.
 */
export default function SignupClient() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    mobileNumber.trim().length > 0 &&
    password.trim().length >= 8 &&
    agreedToTerms;

  const handleSignup = async (): Promise<void> => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await authService.register(
        fullName.trim(),
        email.trim().toLowerCase(),
        password,
        "client",
        mobileNumber.trim()
      );

      // Save auth state to Zustand + AsyncStorage
      await login(
        result.token,
        result.user.id,
        result.user.name,
        result.user.role
      );

      // Navigate to authenticated client layout
      router.replace("/(client)");
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiMessage =
          (err.response?.data as { error?: string })?.error ??
          err.message;
        setErrorMessage(apiMessage);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Signup failed — please try again"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <MahirHeader showBackButton onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <View style={styles.contentWrapper}>
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>Create your account</Text>
              <Text style={styles.subtitle}>
                Get started to book trusted local professionals.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              <FormInput
                icon={<User size={20} color={Colors.onSurfaceVariant} />}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <FormInput
                icon={<Mail size={20} color={Colors.onSurfaceVariant} />}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormInput
                icon={<Smartphone size={20} color={Colors.onSurfaceVariant} />}
                placeholder="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />
              <FormInput
                icon={<Lock size={20} color={Colors.onSurfaceVariant} />}
                placeholder="Password (min. 8 chars)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Terms Checkbox */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToTerms }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agreedToTerms ? Colors.onSurface : Colors.outline,
                    backgroundColor: agreedToTerms ? Colors.primaryContainer : "transparent",
                  },
                ]}
              >
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> &{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>

            {/* Submit Button */}
            <View style={styles.ctaContainer}>
              {isSubmitting ? (
                <View style={styles.loadingBtn}>
                  <ActivityIndicator size="small" color={Colors.onSurface} />
                  <Text style={styles.loadingBtnText}>Creating account...</Text>
                </View>
              ) : (
                <PrimaryButton
                  title="SIGN UP"
                  onPress={handleSignup}
                  disabled={!isFormValid}
                />
              )}
            </View>
          </View>
        </View>

        <AuthFooter mode="login" showFullFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
  },
  contentWrapper: { width: "100%", maxWidth: 400 },
  headingContainer: { alignItems: "center", marginBottom: 32 },
  heading: {
    ...Typography.headlineXlMobile,
    color: Colors.onSurface,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  fieldsContainer: { gap: 12 },
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "700",
    marginTop: -1,
  },
  termsText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginLeft: 12,
    flex: 1,
  },
  termsLink: {
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
  },
  ctaContainer: { marginTop: 16 },
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
});
