import { useSignUp } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BrandLoader from "@/components/BrandLoader";
import { showMessage } from "@/lib/alerts";
import { authStyles } from "@/lib/authStyles";
import { getClerkErrorMessage } from "@/lib/clerkErrors";
import palette from "@/lib/theme";

type Stage = "details" | "verify";

const SignUpScreen = () => {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [stage, setStage] = useState<Stage>("details");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <BrandLoader label="Preparing registration…" />;

  const activateSession = async (sessionId: string | null | undefined) => {
    if (!sessionId) return false;

    await setActive({ session: sessionId });
    router.replace("/(tabs)");
    return true;
  };

  const handleCreateAccount = async () => {
    const email = emailAddress.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Check your email", "Enter a valid email address to register.");
      return;
    }
    if (password.length < 8) {
      showMessage("Check your password", "Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    try {
      const created = await signUp.create({ emailAddress: email, password });
      if (await activateSession(created.createdSessionId)) return;

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
      showMessage(
        "Verify your email",
        `We sent a verification code to ${email}. Enter it below to finish registering.`
      );
    } catch (error) {
      showMessage("Unable to register", getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      showMessage("Check your code", "Enter the verification code we emailed you.");
      return;
    }

    setLoading(true);
    try {
      const verified = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (!(await activateSession(verified.createdSessionId))) {
        showMessage("Verification incomplete", "Check the code and try again.");
      }
    } catch (error) {
      showMessage("Unable to verify", getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      showMessage("Code sent", "A fresh verification code is on its way.");
    } catch (error) {
      showMessage("Unable to resend", getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ flex: 1, backgroundColor: palette.light.background }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: "100%", maxWidth: 360, gap: 16 }}>
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${palette.brand.DEFAULT}20`,
            }}
          >
            <Ionicons name="person-add-outline" size={30} color={palette.brand.DEFAULT} />
          </View>
          <Text style={{ marginTop: 16, fontSize: 28, fontWeight: "700", color: palette.brand.DEFAULT }}>
            {stage === "details" ? "Create account" : "Verify email"}
          </Text>
          <Text
            style={{
              marginTop: 4,
              textAlign: "center",
              color: palette.light.muted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {stage === "details"
              ? "Register with your email and password to shop AfriCart."
              : "Enter the code we sent to your email address."}
          </Text>
        </View>

        {stage === "details" ? (
          <>
            <TextInput
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Email address"
              placeholderTextColor={palette.light.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              style={authStyles.input}
              accessibilityLabel="Email address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (8+ characters)"
              placeholderTextColor={palette.light.muted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleCreateAccount}
              editable={!loading}
              style={authStyles.input}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={handleCreateAccount}
              disabled={loading}
              style={[authStyles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={authStyles.primaryButtonLabel}>Create account</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Verification code"
              placeholderTextColor={palette.light.muted}
              keyboardType="number-pad"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleVerifyCode}
              editable={!loading}
              style={authStyles.input}
              accessibilityLabel="Verification code"
            />
            <TouchableOpacity
              onPress={handleVerifyCode}
              disabled={loading}
              style={[authStyles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Verify email"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={authStyles.primaryButtonLabel}>Verify and continue</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendCode} disabled={loading}>
              <Text style={{ color: palette.light.link, textAlign: "center", fontSize: 14 }}>
                Resend code
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/(auth)")}
          disabled={loading}
          style={{ marginTop: 8, alignItems: "center" }}
          accessibilityRole="link"
          accessibilityLabel="Back to sign in"
        >
          <Text style={{ color: palette.light.muted, fontSize: 14 }}>
            Already have an account?{" "}
            <Text style={{ color: palette.light.link, fontWeight: "600" }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SignUpScreen;
