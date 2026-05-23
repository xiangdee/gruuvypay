
// Real airtime-to-cash flow via automation.airtimetocash.com
//
// Steps:
//   1. User enters phone + network + amount
//   2. OTP sent to user's SIM → user enters OTP
//   3. We show SIM info (balance, tariff) + quota check
//   4. User enters SIM transfer PIN → transfer executed → NGN credited

import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }     from "@expo/vector-icons";
import { useRouter }    from "expo-router";
import { useTheme, textStyles, spacing, radius } from "@/theme";
import apiClient        from "@/api/client";
import { useToast }     from "@/hooks/useToast";
import { S3Link }       from "@/constants/links";

const NETWORKS = [
  { id: "MTN",     name: "MTN",     logo: S3Link + "/bill-providers/mtn.png",     min: 50, max: 10000, rate: 73 },
  { id: "AIRTEL",  name: "Airtel",  logo: S3Link + "/bill-providers/airtel.png",  min: 50, max: 20000, rate: 73 },
  { id: "GLO",     name: "Glo",     logo: S3Link + "/bill-providers/glo.png",     min: 50, max: 1000,  rate: 68 },
  { id: "9MOBILE", name: "9Mobile", logo: S3Link + "/bill-providers/9mobile.png", min: 50, max: 20000, rate: 68 },
];

type Step = "form" | "otp" | "siminfo" | "pin" | "success";

export default function AirtimeToCashScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();

  const [network,   setNetwork]   = useState(NETWORKS[0]);
  const [phone,     setPhone]     = useState("");
  const [amount,    setAmount]    = useState("");
  const [otp,       setOtp]       = useState("");
  const [simPin,    setSimPin]    = useState("");
  const [sessionId, setSessionId] = useState("");
  const [simInfo,   setSimInfo]   = useState<any>(null);
  const [result,    setResult]    = useState<any>(null);
  const [step,      setStep]      = useState<Step>("form");
  const [loading,   setLoading]   = useState(false);

  // Fee model: grossPayout = amount × rate, userPayout = grossPayout - ₦100 fee
  const grossPayout = amount ? Math.floor(parseInt(amount || "0") * network.rate / 100) : 0;
  const cashAmount  = Math.max(0, grossPayout - 100);  // user receives after ₦100 fee

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function sendOtp() {
    if (phone.length < 10) { toast.error("Enter a valid phone number"); return; }
    const amt = parseInt(amount);
    if (!amt || amt < network.min) { toast.error(`Minimum is ₦${network.min}`); return; }
    if (amt > network.max) { toast.error(`Maximum for ${network.name} is ₦${network.max.toLocaleString()}`); return; }

    setLoading(true);
    try {
      await apiClient.post("/airtime-to-cash/otp/send", {
        networkName: network.id,
        sender:      phone,
      });
      toast.success("OTP Sent", `Enter the OTP sent to ${phone}`);
      setStep("otp");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not send OTP");
    } finally { setLoading(false); }
  }

  // ── Step 2: Verify OTP then login with session ────────────────────────────
  async function verifyOtp() {
    if (otp.length < 4) { toast.error("Enter the OTP sent to your phone"); return; }
    setLoading(true);
    try {
      // First: verify the OTP
      const verifyRes = await apiClient.post("/airtime-to-cash/otp/verify", {
        networkName: network.id,
        sender:      phone,
        otp,
      });

      const sid = verifyRes.data.sessionId;
      setSessionId(sid);

      // Second: login with session ID to confirm and get fresh SIM info
      const sessionRes = await apiClient.post("/airtime-to-cash/session", {
        networkName: network.id,
        sender:      phone,
        sessionId:   sid,
      });

      setSimInfo(sessionRes.data);
      setStep("siminfo");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid OTP";
      if (msg.toLowerCase().includes("session")) {
        toast.error("Session error. Please request a new OTP.");
        setStep("otp");
      } else {
        toast.error(msg);
      }
    } finally { setLoading(false); }
  }

  // ── Step 3: Check quota + proceed to PIN ──────────────────────────────────
  async function checkAndProceed() {
    setLoading(true);
    try {
      const res = await apiClient.post("/airtime-to-cash/quota", {
        networkName: network.id,
        amount:      parseInt(amount),
      });
      // API returns code 5030 for "Recipient(s) Available" — this is SUCCESS per docs
      if (!res.data.available) {
        toast.error("No recipients available right now. Please try again in a few minutes.");
        return;
      }
      setStep("pin");
    } catch {
      // proceed anyway
      setStep("pin");
    } finally { setLoading(false); }
  }

  // ── Step 4: Transfer ──────────────────────────────────────────────────────
  async function transfer() {
    if (simPin.length < 4) { toast.error("Enter your SIM transfer PIN"); return; }
    setLoading(true);
    try {
      const res = await apiClient.post("/airtime-to-cash/transfer", {
        networkName: network.id,
        sender:      phone,
        amount:      parseInt(amount),
        simPin,
        sessionId,
      });
      setResult(res.data);
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Transfer failed";
      if (msg.toLowerCase().includes("session")) {
        toast.error("Session expired. Please start again.");
        setStep("form");
        setOtp(""); setSimPin(""); setSessionId("");
      } else {
        toast.error(msg);
      }
    } finally { setLoading(false); }
  }

  function goBack() {
    if (step === "otp")     { setStep("form"); }
    else if (step === "siminfo") { setStep("otp"); }
    else if (step === "pin")     { setStep("siminfo"); }
    else { router.back(); }
  }

  const steps = ["form", "otp", "siminfo", "pin", "success"] as Step[];
  const stepIdx = steps.indexOf(step);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Airtime to Cash</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicators */}
      {step !== "success" && (
        <View style={styles.stepRow}>
          {["Form", "OTP", "SIM Info", "PIN", "Success"].map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, {
                backgroundColor: i <= stepIdx - 0 && step.toUpperCase().replace("-", "") !== "success"
                  ? theme.brand.primary
                  : theme.bg.secondary,
                borderColor: i === stepIdx ? theme.brand.primary : "transparent",
                borderWidth: 2,
              }]}>
                <Text style={{ color: i <= stepIdx ? "#fff" : theme.text.muted, fontSize: 11, fontWeight: "700" }}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[{ fontSize: 9, color: i === stepIdx ? theme.brand.primary : theme.text.muted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Form ────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            {/* Network */}
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Select Network</Text>
            <View style={styles.networkRow}>
              {NETWORKS.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => setNetwork(n)}
                  style={[styles.networkCard, {
                    backgroundColor: network.id === n.id ? theme.brand.primary + "15" : theme.bg.secondary,
                    borderColor:     network.id === n.id ? theme.brand.primary : "transparent",
                    borderWidth: 1.5,
                  }]}
                >
                  <Image source={{ uri: n.logo }} style={styles.logo} resizeMode="contain" />
                  <Text style={[textStyles.caption, { color: theme.text.primary }]}>{n.name}</Text>
                  <Text style={[{ fontSize: 10, color: theme.brand.primary, fontWeight: "700" }]}>{n.rate}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rate info */}
            <View style={[styles.rateCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
              <Text style={[textStyles.label, { color: "#1D4ED8" }]}>Rate & Fees</Text>
              <Text style={[textStyles.body, { color: "#1E40AF" }]}>
                ₦100 airtime → ₦{network.rate} gross
              </Text>
              <Text style={[textStyles.caption, { color: "#6B7280" }]}>
                Service fee: ₦100 per transaction
              </Text>
              <Text style={[textStyles.caption, { color: "#6B7280", marginTop: 2 }]}>
                Limit: ₦{network.min} – ₦{network.max.toLocaleString()}
              </Text>
            </View>

            {/* Phone */}
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Your {network.name} Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.DEFAULT }]}
              value={phone} onChangeText={setPhone}
              placeholder="08012345678" placeholderTextColor={theme.text.muted}
              keyboardType="phone-pad" maxLength={11}
            />

            {/* Amount */}
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Airtime Amount (₦)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.DEFAULT }]}
              value={amount} onChangeText={setAmount}
              placeholder={`₦${network.min} – ₦${network.max.toLocaleString()}`}
              placeholderTextColor={theme.text.muted}
              keyboardType="numeric"
            />

            {/* Cash preview */}
            {cashAmount > 0 && (
              <View style={[styles.previewCard, { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }]}>
                <Text style={[textStyles.caption, { color: "#15803D" }]}>You will receive</Text>
                <Text style={[textStyles.h2, { color: "#16A34A" }]}>₦{cashAmount.toLocaleString()}</Text>
                <Text style={[textStyles.caption, { color: "#15803D" }]}>Credited to GruuvyPay wallet</Text>
              </View>
            )}

            <View style={[styles.infoBox, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.text.muted} />
              <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1, lineHeight: 18 }]}>
                An OTP will be sent to your SIM. You will also need your SIM transfer PIN to complete this transaction.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={sendOtp} disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[textStyles.label, { color: "#00" }]}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: OTP ──────────────────────────────────────────────── */}
        {step === "otp" && (
          <View style={styles.center}>
            <View style={[styles.otpIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#1B4FD8" />
            </View>
            <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[4] }]}>
              Enter OTP
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginBottom: spacing[5] }]}>
              Enter the OTP sent to {phone}
            </Text>

            <TextInput
              style={[styles.otpInput, { backgroundColor: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.DEFAULT }]}
              value={otp} onChangeText={setOtp}
              placeholder="Enter OTP" placeholderTextColor={theme.text.muted}
              keyboardType="numeric" maxLength={8}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary, width: "100%", marginTop: spacing[4] }]}
              onPress={verifyOtp} disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[textStyles.label, { color: "#fff" }]}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={sendOtp} style={{ marginTop: spacing[3] }}>
              <Text style={[textStyles.caption, { color: theme.brand.primary }]}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: SIM Info ─────────────────────────────────────────── */}
        {step === "siminfo" && simInfo && (
          <>
            <View style={[styles.simCard, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>SIM Verified</Text>
              {[
                { label: "Phone",          value: phone },
                { label: "Network",        value: network.name },
                { label: "Airtime Balance",value: simInfo.airtimeBalance ?? "N/A" },
                { label: "Tariff",         value: simInfo.tariff ?? "N/A" },
                { label: "Amount to Send", value: `₦${parseInt(amount).toLocaleString()}` },
                { label: "Cash to Receive",value: `₦${cashAmount.toLocaleString()}` },
              ].map((row, i) => (
                <View key={i} style={styles.infoRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{row.label}</Text>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
              <Ionicons name="warning-outline" size={16} color="#D97706" />
              <Text style={[textStyles.caption, { color: "#92400E", flex: 1, lineHeight: 18 }]}>
                On the next screen you will need your SIM transfer PIN. This is the PIN you use to transfer airtime on your network (not your GruuvyPay PIN).
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={checkAndProceed} disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={[textStyles.label, { color: "#fff" }]}>Continue to Transfer</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 4: SIM PIN ──────────────────────────────────────────── */}
        {step === "pin" && (
          <View style={styles.center}>
            <View style={[styles.otpIcon, { backgroundColor: "#FEF9C3" }]}>
              <Ionicons name="keypad-outline" size={36} color="#D97706" />
            </View>
            <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[4] }]}>SIM Transfer PIN</Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginBottom: spacing[4] }]}>
              Enter your {network.name} airtime transfer PIN
            </Text>

            <TextInput
              style={[styles.otpInput, { backgroundColor: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.DEFAULT, letterSpacing: 8 }]}
              value={simPin} onChangeText={setSimPin}
              placeholder="••••" placeholderTextColor={theme.text.muted}
              secureTextEntry keyboardType="numeric" maxLength={6}
              textAlign="center"
            />

            <View style={[styles.infoBox, { backgroundColor: theme.bg.secondary, marginTop: spacing[4], width: "100%" }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.text.muted} />
              <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1, lineHeight: 18 }]}>
                This is NOT your GruuvyPay PIN. It is your SIM card transfer PIN set by {network.name}.
                {network.id === "MTN" ? " Default MTN PIN is 0000." : ""}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary, marginTop: spacing[4], width: "100%" }]}
              onPress={transfer} disabled={loading}
            >
              {loading
                ? <><ActivityIndicator color="#fff" style={{ marginRight: spacing[2] }} /><Text style={[textStyles.label, { color: "#fff" }]}>Transferring...</Text></>
                : <Text style={[textStyles.label, { color: "#fff" }]}>Transfer ₦{parseInt(amount).toLocaleString()} Airtime</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 5: Success ───────────────────────────────────────────── */}
        {step === "success" && result && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>
              ₦{result.userPayout?.toLocaleString()} Received!
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginTop: spacing[2] }]}>
              {result.message}
            </Text>

            <View style={[styles.simCard, { backgroundColor: theme.bg.secondary, marginTop: spacing[4] }]}>
              {[
                { label: "Airtime Sent",  value: `₦${result.airtimeAmt?.toLocaleString()}` },
                { label: "Cash Received", value: `₦${result.userPayout?.toLocaleString()}`, highlight: true },
                { label: "Service Fee",   value: `₦${result.ourFee ?? 100}` },
                { label: "Rate",          value: result.rate },
                { label: "Reference",     value: result.reference },
              ].map((row, i) => (
                <View key={i} style={styles.infoRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{row.label}</Text>
                  <Text style={[textStyles.label, { color: row.highlight ? "#22C55E" : theme.text.primary }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary, marginTop: spacing[5] }]}
              onPress={() => router.replace("/(app)" as any)}
            >
              <Text style={[textStyles.label, { color: "#fff" }]}>View Wallet</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  topBar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[4] },
  stepRow:     { flexDirection: "row", justifyContent: "center", gap: spacing[4], paddingBottom: spacing[3] },
  stepItem:    { alignItems: "center", gap: 4 },
  stepDot:     { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  content:     { padding: spacing[4], gap: spacing[4] },
  networkRow:  { flexDirection: "row", gap: spacing[2] },
  networkCard: { flex: 1, alignItems: "center", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1] },
  logo:        { width: 36, height: 36, borderRadius: 8 },
  rateCard:    { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], alignItems: "center", gap: spacing[1] },
  input:       { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], fontSize: 15 },
  previewCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], alignItems: "center", gap: spacing[1] },
  infoBox:     { flexDirection: "row", gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
  cta:         { padding: spacing[4], borderRadius: radius.xl, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  center:      { alignItems: "center", paddingTop: spacing[2] },
  otpIcon:     { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  otpInput:    { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], fontSize: 24, width: 200, textAlign: "center" },
  simCard:     { width: "100%", borderRadius: radius.xl, padding: spacing[4], gap: spacing[3] },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});