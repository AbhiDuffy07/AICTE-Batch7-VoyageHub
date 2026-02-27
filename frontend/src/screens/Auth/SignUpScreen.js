import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  sendOTP,
  verifyOTP,
  signInWithGoogle,
  updateDisplayName,
} from "../../services/supabase";

export default function SignUpScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=username
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [username, setUsername] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    try {
      setSendingOTP(true);
      await sendOTP(email);
      setStep(2);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send code.");
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }
    try {
      setVerifying(true);
      const user = await verifyOTP(email, otpCode);
      if (user) setStep(3);
    } catch (error) {
      Alert.alert("Wrong Code", "Code is incorrect or expired. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim().length < 2) {
      Alert.alert("Invalid Name", "Please enter at least 2 characters.");
      return;
    }
    try {
      setSavingName(true);
      await updateDisplayName(username.trim());
      navigation.replace("MainTabs");
    } catch (error) {
      Alert.alert("Error", "Could not save username. Try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      if (user) navigation.replace("MainTabs");
    } catch (error) {
      Alert.alert("Error", error.message || "Google sign-up failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── STEP INDICATOR ──
  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={[styles.stepLine, step > s && styles.stepLineActive]}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* BACK */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* HEADER */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>🌍</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join VoyageHub for free</Text>
        </View>

        <StepIndicator />

        {/* ── STEP 1 — EMAIL ── */}
        {step === 1 && (
          <>
            {/* GOOGLE */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignUp}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use email</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.stepLabel}>Step 1 — Enter your email</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6200ee"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#aaa"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.mainBtn,
                sendingOTP && { backgroundColor: "#999" },
              ]}
              onPress={handleSendOTP}
              disabled={sendingOTP}
            >
              {sendingOTP ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>Send Verification Code →</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2 — OTP ── */}
        {step === 2 && (
          <>
            <View style={styles.sentBox}>
              <Ionicons name="mail" size={32} color="#6200ee" />
              <Text style={styles.sentTitle}>Check Your Email</Text>
              <Text style={styles.sentDesc}>
                6-digit code sent to{"\n"}
                <Text style={{ fontWeight: "700" }}>{email}</Text>
              </Text>
            </View>

            <Text style={styles.stepLabel}>Step 2 — Enter the code</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="keypad-outline"
                size={20}
                color="#6200ee"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.input,
                  { letterSpacing: 8, fontSize: 22, fontWeight: "700" },
                ]}
                placeholder="000000"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholderTextColor="#ccc"
              />
            </View>
            <TouchableOpacity
              style={[styles.mainBtn, verifying && { backgroundColor: "#999" }]}
              onPress={handleVerifyOTP}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>Verify Code →</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => {
                setStep(1);
                setOtpCode("");
              }}
            >
              <Text style={styles.resendText}>← Change email</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3 — USERNAME ── */}
        {step === 3 && (
          <>
            <View style={styles.sentBox}>
              <Text style={{ fontSize: 40 }}>👋</Text>
              <Text style={styles.sentTitle}>Almost There!</Text>
              <Text style={styles.sentDesc}>
                Pick a display name for your profile
              </Text>
            </View>

            <Text style={styles.stepLabel}>Step 3 — Choose your username</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#6200ee"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Duffy, Alex, TravelKing..."
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                autoFocus
                placeholderTextColor="#aaa"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.mainBtn,
                savingName && { backgroundColor: "#999" },
              ]}
              onPress={handleSaveUsername}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>Start Exploring 🚀</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* SWITCH TO LOGIN */}
        {step === 1 && (
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.switchLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  logoSection: { alignItems: "center", marginBottom: 24 },
  logo: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#222", marginBottom: 6 },
  subtitle: { fontSize: 16, color: "#888" },
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: { backgroundColor: "#6200ee" },
  stepNum: { fontSize: 13, fontWeight: "700", color: "#999" },
  stepNumActive: { color: "#fff" },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#eee",
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: "#6200ee" },
  stepLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 12,
    fontWeight: "600",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 1,
  },
  googleIcon: { fontSize: 18, fontWeight: "900", color: "#4285F4" },
  googleBtnText: { fontSize: 16, fontWeight: "600", color: "#333" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  dividerText: { fontSize: 13, color: "#aaa" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#333" },
  mainBtn: {
    backgroundColor: "#6200ee",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 12,
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sentBox: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
    marginBottom: 16,
  },
  sentTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  sentDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  resendBtn: { alignItems: "center", marginBottom: 12 },
  resendText: { fontSize: 14, color: "#6200ee", fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  switchText: { fontSize: 15, color: "#888" },
  switchLink: { fontSize: 15, color: "#6200ee", fontWeight: "700" },
});
