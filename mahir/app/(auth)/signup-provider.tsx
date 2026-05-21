import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Smartphone,
  Briefcase,
  CreditCard,
  Lock,
  ChevronDown,
  Mail,
} from "lucide-react-native";
import MahirHeader from "@/components/ui/MahirHeader";
import FormInput from "@/components/ui/FormInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OrDivider from "@/components/ui/OrDivider";
import SocialButton from "@/components/ui/SocialButton";
import { Colors, Typography } from "@/constants/design-tokens";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { AxiosError } from "axios";

const SKILLS = [
  { label: "Plumber", value: "plumber" },
  { label: "Electrician", value: "electrician" },
  { label: "Carpenter", value: "carpenter" },
  { label: "AC Technician", value: "ac_technician" },
  { label: "Painter", value: "painter" },
  { label: "Mason", value: "mason" },
];

export default function SignupProvider() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [skill, setSkill] = useState("");
  const [cnic, setCnic] = useState("");
  const [pw, setPw] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const valid =
    fullName.trim() &&
    email.trim() &&
    mobile.trim() &&
    skill &&
    cnic.trim() &&
    pw.trim().length >= 8 &&
    agreed;

  const skillLabel = SKILLS.find((s) => s.value === skill)?.label ?? "";

  const handleSignup = async (): Promise<void> => {
    if (!valid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await authService.register(
        fullName.trim(),
        email.trim().toLowerCase(),
        pw,
        "provider",
        mobile.trim()
      );

      // Save auth state to Zustand + AsyncStorage
      await login(
        result.token,
        result.user.id,
        result.user.name,
        result.user.role
      );

      // Navigate to authenticated provider layout
      router.replace("/(provider)");
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
    <SafeAreaView style={s.safe} edges={["top"]}>
      <MahirHeader showBackButton onBack={() => router.back()} />
      <ScrollView
        style={s.sv}
        contentContainerStyle={s.svc}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.main}>
          <View style={s.wrap}>
            <View style={s.hd}>
              <Text style={s.h1}>Become a Mahir</Text>
              <Text style={s.sub}>
                Register your skills and grow your daily income.
              </Text>
            </View>
            <View style={s.fields}>
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
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
              <Pressable onPress={() => setShowPicker(true)} style={s.picker}>
                <View style={s.pIco}>
                  <Briefcase size={20} color={Colors.onSurfaceVariant} />
                </View>
                <Text
                  style={[
                    s.pTxt,
                    { color: skill ? Colors.onSurface : Colors.onSurfaceVariant },
                  ]}
                >
                  {skillLabel || "Primary Skill"}
                </Text>
                <ChevronDown size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
              <FormInput
                icon={<CreditCard size={20} color={Colors.onSurfaceVariant} />}
                placeholder="CNIC Number"
                value={cnic}
                onChangeText={setCnic}
                keyboardType="numeric"
              />
              <FormInput
                icon={<Lock size={20} color={Colors.onSurfaceVariant} />}
                placeholder="Password (min. 8 chars)"
                value={pw}
                onChangeText={setPw}
                secureTextEntry
              />
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={s.errorWrap}>
                <Text style={s.errorText}>{errorMessage}</Text>
              </View>
            )}

            <Pressable
              style={s.terms}
              onPress={() => setAgreed(!agreed)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <View
                style={[
                  s.cb,
                  {
                    borderColor: agreed ? Colors.onSurface : Colors.outline,
                    backgroundColor: agreed
                      ? Colors.primaryContainer
                      : "transparent",
                  },
                ]}
              >
                {agreed && <Text style={s.ck}>✓</Text>}
              </View>
              <Text style={s.tTxt}>I agree to the Terms of Service</Text>
            </Pressable>

            <View style={s.cta}>
              {isSubmitting ? (
                <View style={s.loadingBtn}>
                  <ActivityIndicator size="small" color={Colors.onSurface} />
                  <Text style={s.loadingBtnText}>Joining Mahir...</Text>
                </View>
              ) : (
                <PrimaryButton
                  title="JOIN AS MAHIR"
                  onPress={handleSignup}
                  disabled={!valid}
                />
              )}
            </View>

            <View style={s.lr}>
              <Text style={s.lt}>Already have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text style={s.ll}>Log In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={s.mo} onPress={() => setShowPicker(false)}>
          <View style={s.ms}>
            <View style={s.mh} />
            <Text style={s.mt}>Select Primary Skill</Text>
            <FlatList
              data={SKILLS}
              keyExtractor={(i) => i.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSkill(item.value);
                    setShowPicker(false);
                  }}
                  style={[
                    s.mop,
                    {
                      backgroundColor:
                        skill === item.value
                          ? Colors.primaryContainer + "4D"
                          : "transparent",
                    },
                  ]}
                >
                  <Text style={s.mot}>{item.label}</Text>
                  {skill === item.value && <View style={s.md} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  sv: { flex: 1 },
  svc: { flexGrow: 1 },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  wrap: { width: "100%", maxWidth: 400 },
  hd: { marginBottom: 32 },
  h1: {
    ...Typography.headlineXlMobile,
    color: Colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  fields: { gap: 12 },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.outline + "66",
  },
  pIco: { marginRight: 12 },
  pTxt: { flex: 1, ...Typography.bodyMd },
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
  terms: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 8,
  },
  cb: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  ck: { fontSize: 14, color: Colors.onSurface, fontWeight: "700", marginTop: -1 },
  tTxt: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginLeft: 12,
    flex: 1,
  },
  cta: { marginTop: 16 },
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
  lr: { marginTop: 32, flexDirection: "row", justifyContent: "center" },
  lt: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  ll: {
    ...Typography.bodySm,
    fontFamily: "Sora_600SemiBold",
    color: Colors.onSurface,
  },
  mo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  ms: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  mh: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginTop: 12,
    marginBottom: 16,
  },
  mt: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  mop: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mot: { ...Typography.bodyMd, color: Colors.onSurface },
  md: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
