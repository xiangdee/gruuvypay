// app/(app)/send.tsx
// Step 1: Enter @GruuvyTag
// Step 2: Enter amount + narration
// Step 3: PIN confirmation
// Step 4: Success

import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PinInput } from '@/components/ui/PinInput';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useSendMoney } from '@/screens/app/useSendMoney';

export default function SendMoneyScreen() {
  const { theme } = useTheme();
  const {
    step, tag, setTag, tagError,
    recipient, amount, setAmount, amountError,
    narration, setNarration, loading,
    pinError, pinRef, txRef, wallet,
    QUICK_AMOUNTS, lookupTag, proceedToPin,
    onPinComplete, setQuickAmount, goBack,
    sendAnother, goHome, getTierInfo,
  } = useSendMoney();

  // ── Step 1: Tag input ─────────────────────────────────────────────────
  if (step === 'tag') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <KeyboardView>
          <View style={styles.screen}>
            <Header title="Send Money" onBack={goBack} theme={theme} />

            <View style={styles.body}>
              <Text style={[textStyles.h2, { color: theme.text.primary, marginBottom: spacing[2] }]}>
                Who are you sending to?
              </Text>
              <Text style={[textStyles.body, { color: theme.text.secondary, marginBottom: spacing[6] }]}>
                Enter their GruuvyTag to send money instantly
              </Text>

              <Input
                placeholder="@username"
                autoCapitalize="none"
                autoCorrect={false}
                value={tag}
                onChangeText={(t) => {
                  setTag(t);
                }}
                error={tagError}
                leftIcon={<Ionicons name="at" size={20} color={theme.text.muted} />}
                returnKeyType="search"
                onSubmitEditing={lookupTag}
              />
            </View>

            <View style={styles.cta}>
              <Button
                label="Find User"
                onPress={lookupTag}
                loading={loading}
                disabled={!tag.trim()}
              />
            </View>
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Amount entry ──────────────────────────────────────────────
  if (step === 'amount') {
    const balanceNaira = (parseInt(wallet.balanceRaw ?? '0') / 100).toFixed(2);
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <KeyboardView scrollable>
          <View style={styles.screen}>
            <Header title="Send Money" onBack={goBack} theme={theme} />

            {/* Recipient card */}
            <View style={[styles.recipientCard, { backgroundColor: theme.bg.secondary }]}>
              <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
                <Text style={[textStyles.h3, { color: '#fff' }]}>
                  {recipient?.name[0]}
                </Text>
              </View>
              <View>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>
                  {recipient?.name}
                </Text>
                <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>
                  {recipient?.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={goBack}
                style={styles.changeBtn}
              >
                <Text style={[textStyles.labelSm, { color: theme.text.link }]}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={[styles.amountCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
                AMOUNT (NGN)
              </Text>

              <View style={styles.amountRow}>
                <Text style={[textStyles.h2, { color: theme.text.secondary }]}>₦</Text>
                <TextInput
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v.replace(/[^0-9.]/g, ''));
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.text.muted}
                  keyboardType="decimal-pad"
                  style={[textStyles.h1, { color: theme.text.primary, flex: 1 }]}
                  autoFocus
                />
              </View>

              <View style={styles.balanceRow}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  Balance: ₦{balanceNaira}
                </Text>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  Max: {getTierInfo().maxSend} · Daily: {getTierInfo().dailyLimit}
                </Text>
              </View>

              {amountError ? (
                <Text style={[textStyles.caption, { color: theme.status.error, marginTop: spacing[1] }]}>
                  {amountError}
                </Text>
              ) : null}
            </View>

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuickAmount(q)}
                  style={[
                    styles.quickChip,
                    { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT },
                    amount === q.replace(',', '') && { borderColor: theme.brand.primary, backgroundColor: theme.brand.primary + '15' },
                  ]}
                >
                  <Text style={[
                    textStyles.labelSm,
                    { color: amount === q.replace(',', '') ? theme.brand.primary : theme.text.secondary },
                  ]}>
                    ₦{q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Narration */}
            <Input
              placeholder="Add a note (optional)"
              value={narration}
              onChangeText={setNarration}
              leftIcon={<Ionicons name="chatbubble-outline" size={18} color={theme.text.muted} />}
              maxLength={50}
            />

            <View style={styles.cta}>
              <Button
                label="Continue"
                onPress={proceedToPin}
                disabled={!amount}
              />
            </View>
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }

  // ── Step 3: PIN ───────────────────────────────────────────────────────
  if (step === 'pin') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.screen}>
          <Header title="Confirm Transfer" onBack={goBack} theme={theme} />

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
            <SummaryRow label="To"      value={`${recipient?.name} (${recipient?.username})`} theme={theme} />
            <SummaryRow label="Amount"  value={`₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} theme={theme} highlight />
            {narration ? <SummaryRow label="Note" value={narration} theme={theme} /> : null}
          </View>

          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginBottom: spacing[8] }]}>
            Enter your PIN to confirm
          </Text>

          {loading
            ? <ActivityIndicator size="large" color={theme.brand.primary} style={{ flex: 1 }} />
            : (
              <PinInput
                onComplete={onPinComplete}
                error={pinError}
                onRef={(api) => { pinRef.current = api; }}
                style={{ flex: 1 }}
              />
            )
          }
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 4: Success ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={[styles.screen, styles.successScreen]}>
        {/* Success icon */}
        <View style={[styles.successIcon, { backgroundColor: theme.status.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
        </View>

        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
          Transfer Successful!
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
          ₦{parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} sent to {recipient?.name}
        </Text>
        <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[2] }]}>
          Ref: {txRef}
        </Text>

        <View style={styles.successActions}>
          <Button label="Send Again"  onPress={sendAnother} variant="secondary" />
          <Button label="Go to Home"  onPress={goHome}      variant="primary"   />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────

function Header({ title, onBack, theme }: { title: string; onBack: () => void; theme: any }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
      </TouchableOpacity>
      <Text style={[textStyles.h3, { color: theme.text.primary }]}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function SummaryRow({ label, value, theme, highlight }: {
  label: string; value: string; theme: any; highlight?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{label}</Text>
      <Text style={[
        textStyles.label,
        { color: highlight ? theme.brand.primary : theme.text.primary, flexShrink: 1, textAlign: 'right' },
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  screen:   { flex: 1, paddingHorizontal: spacing[4] },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body:     { flex: 1, paddingTop: spacing[4] },
  cta:      { paddingVertical: spacing[5] },

  recipientCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    borderRadius:  radius.xl,
    padding:       spacing[4],
    marginBottom:  spacing[4],
  },
  avatar: {
    width: 44, height: 44,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  changeBtn: { marginLeft: 'auto' },

  amountCard: {
    borderRadius:  radius.xl,
    padding:       spacing[4],
    marginBottom:  spacing[4],
    gap:           spacing[2],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },

  quickRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[2],
    marginBottom:  spacing[4],
  },
  quickChip: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:      radius.full,
    borderWidth:       1,
  },

  summaryCard: {
    borderRadius:  radius.xl,
    padding:       spacing[4],
    marginBottom:  spacing[6],
    gap:           spacing[3],
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            spacing[4],
  },

  successScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 120, height: 120,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successActions: {
    width:     '100%',
    gap:       spacing[3],
    marginTop: spacing[10],
  },
});