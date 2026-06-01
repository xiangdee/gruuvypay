// app/(app)/one-time-account.tsx
// Generate a one-time virtual account for a specific amount

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { walletApi } from '@/api/wallet.api';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useToast } from '@/hooks/useToast';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

interface GeneratedVA {
  accountNumber: string;
  bankName:      string;
  accountName:   string;
  amount:        number;
  expiresAt:     string;
}

function formatAmount(n: number) {
  return n.toLocaleString('en-NG');
}

function formatExpiry(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-NG', {
      hour: '2-digit', minute: '2-digit',
      day: 'numeric', month: 'short',
    });
  } catch { return ''; }
}

export default function OneTimeAccountScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();

  const [inputAmount, setInputAmount] = useState('');
  const [generating, setGenerating]   = useState(false);
  const [va, setVA]                   = useState<GeneratedVA | null>(null);
  const [copied, setCopied]           = useState(false);

  const parsedAmount = parseInt(inputAmount.replace(/,/g, ''), 10);
  const canGenerate  = !isNaN(parsedAmount) && parsedAmount >= 1;

  function handleQuickAmount(n: number) {
    setInputAmount(String(n));
    setVA(null);
  }

  function handleAmountChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    setInputAmount(digits);
    setVA(null);
  }

  async function generate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await walletApi.generateOneTimeAccount(parsedAmount);
      setVA(result);
    } catch (err: any) {
      const msg = err?.message ?? 'Could not generate account';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function copyNumber() {
    if (!va) return;
    await Clipboard.setStringAsync(va.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>One-Time Account</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginBottom: spacing[5] }]}>
          Enter the exact amount you want to deposit. You will receive a temporary bank account number to transfer to.
        </Text>

        {/* Warning card */}
        <View style={[styles.warnCard, { backgroundColor: theme.status.warning + '18', borderColor: theme.status.warning + '50' }]}>
          <Ionicons name="warning-outline" size={18} color={theme.status.warning} />
          <Text style={[textStyles.bodySm, { color: theme.status.warning, flex: 1 }]}>
            You must transfer EXACTLY the amount shown. Sending a different amount may cause a delay or the account may not credit your wallet.
          </Text>
        </View>

        {/* Amount input + generate — hidden once account is generated */}
        {!va && (
          <>
            <View style={styles.inputWrap}>
              <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
                Amount (NGN)
              </Text>
              <View style={[styles.amountRow, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
                <Text style={[textStyles.h3, { color: theme.text.muted }]}>₦</Text>
                <TextInput
                  style={[textStyles.h3, styles.amountInput, { color: theme.text.primary }]}
                  value={inputAmount}
                  onChangeText={handleAmountChange}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.text.muted}
                  maxLength={7}
                />
              </View>
              {inputAmount && !isNaN(parsedAmount) && parsedAmount < 1 && (
                <Text style={[textStyles.caption, { color: theme.status.error, marginTop: spacing[1] }]}>
                  Amount must be at least ₦1
                </Text>
              )}
            </View>

            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleQuickAmount(n)}
                  style={[
                    styles.quickChip,
                    { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT },
                    inputAmount === String(n) && { backgroundColor: theme.brand.primary + '18', borderColor: theme.brand.primary },
                  ]}
                >
                  <Text style={[
                    textStyles.labelSm,
                    { color: inputAmount === String(n) ? theme.brand.primary : theme.text.secondary },
                  ]}>
                    ₦{formatAmount(n)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={generate}
              disabled={!canGenerate || generating}
              style={[
                styles.generateBtn,
                { backgroundColor: canGenerate && !generating ? theme.brand.primary : theme.bg.secondary },
              ]}
              activeOpacity={0.85}
            >
              {generating ? (
                <ActivityIndicator size="small" color={canGenerate ? '#000' : theme.text.muted} />
              ) : (
                <Ionicons name="flash-outline" size={20} color={canGenerate ? '#000' : theme.text.muted} />
              )}
              <Text style={[
                textStyles.label,
                { color: canGenerate && !generating ? '#000' : theme.text.muted },
              ]}>
                {generating ? 'Generating...' : 'Generate Account'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Generated account card */}
        {va && (
          <View style={[styles.vaCard, { backgroundColor: theme.bg.secondary, borderColor: theme.brand.primary + '50' }]}>
            <View style={styles.vaCardHeader}>
              <View style={[styles.otaBadge, { backgroundColor: theme.brand.primary + '20' }]}>
                <Ionicons name="flash-outline" size={12} color={theme.brand.primary} />
                <Text style={[textStyles.caption, { color: theme.brand.primary }]}>ONE-TIME</Text>
              </View>
              {va.expiresAt ? (
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  Expires {formatExpiry(va.expiresAt)}
                </Text>
              ) : null}
            </View>

            {/* Exact amount banner */}
            <View style={[styles.amountBanner, { backgroundColor: theme.brand.primary }]}>
              <Text style={[textStyles.caption, { color: 'rgba(0,0,0,0.6)', letterSpacing: 0.8 }]}>
                TRANSFER EXACTLY
              </Text>
              <Text style={[styles.exactAmount, { color: '#000' }]}>
                ₦{formatAmount(va.amount)}
              </Text>
            </View>

            <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginTop: spacing[4] }]}>
              BANK NAME
            </Text>
            <Text style={[textStyles.label, { color: theme.text.primary, marginTop: 2 }]}>
              {va.bankName}
            </Text>

            <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginTop: spacing[3] }]}>
              ACCOUNT NUMBER
            </Text>
            <Text style={[styles.accNumber, { color: theme.text.primary }]}>
              {va.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
            </Text>

            <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginTop: spacing[3] }]}>
              ACCOUNT NAME
            </Text>
            <Text style={[textStyles.label, { color: theme.text.primary, marginTop: 2 }]}>
              {va.accountName}
            </Text>

            {/* Copy button */}
            <TouchableOpacity
              onPress={copyNumber}
              style={[
                styles.copyBtn,
                { backgroundColor: copied ? theme.status.success + '20' : theme.brand.primary + '15', borderColor: copied ? theme.status.success : theme.brand.primary },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                size={18}
                color={copied ? theme.status.success : theme.brand.primary}
              />
              <Text style={[textStyles.label, { color: copied ? theme.status.success : theme.brand.primary }]}>
                {copied ? 'Copied!' : 'Copy Account Number'}
              </Text>
            </TouchableOpacity>

            {/* Regenerate */}
            <TouchableOpacity
              onPress={() => { setVA(null); setInputAmount(''); }}
              style={[styles.resetBtn, { borderColor: theme.border.DEFAULT }]}
            >
              <Ionicons name="refresh-outline" size={15} color={theme.text.muted} />
              <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>Generate New</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },

  warnCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing[2], borderRadius: radius.lg, borderWidth: 1,
    padding: spacing[3], marginBottom: spacing[5],
  },

  inputWrap: { marginBottom: spacing[4] },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl, borderWidth: 1.5,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    gap: spacing[1],
  },
  amountInput: { flex: 1 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] },
  quickChip: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1,
  },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], borderRadius: radius.xl,
    paddingVertical: spacing[4], marginBottom: spacing[5],
  },

  vaCard: {
    borderRadius: radius.xl, borderWidth: 1.5,
    padding: spacing[4],
  },
  vaCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  otaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.full,
  },
  amountBanner: {
    borderRadius: radius.lg, padding: spacing[4],
    alignItems: 'center',
  },
  exactAmount: { fontSize: 36, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  accNumber:   { fontSize: 26, fontWeight: '800', letterSpacing: 4, marginTop: spacing[1] },

  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], borderWidth: 1.5, borderRadius: radius.xl,
    paddingVertical: spacing[3], marginTop: spacing[4],
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[1], borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    marginTop: spacing[3],
  },
});
