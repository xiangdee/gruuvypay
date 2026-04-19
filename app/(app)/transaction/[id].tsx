// Full transaction detail + receipt
// Supports: print, share, email receipt

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import { Ionicons }      from '@expo/vector-icons';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print        from 'expo-print';
import * as Sharing      from 'expo-sharing';
import apiClient         from '@/api/client';
import { useToast }      from '@/hooks/useToast';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface TxDetail {
  id:         string;
  reference:  string;
  type:       string;
  status:     string;
  amount:     string;
  fee:        string | null;
  narration:  string | null;
  createdAt:  string;
  user:       { name: string; email: string; username: string };
  receipt: {
    category:     string;
    direction?:   string;
    counterpart?: string;
    billersCode?: string;
    product?:     string;
    token?:       string | null;
    vtpassRef?:   string;
    coin?:        string;
    cryptoAmount?: string;
    channel?:     string;
    bankRef?:     string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS:  '#16A34A',
  PENDING:  '#CA8A04',
  FAILED:   '#DC2626',
  REVERSED: '#7C3AED',
};

const STATUS_ICONS: Record<string, string> = {
  SUCCESS:  'checkmark-circle',
  PENDING:  'time',
  FAILED:   'close-circle',
  REVERSED: 'refresh-circle',
};

export default function TransactionDetailScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const { id }     = useLocalSearchParams<{ id: string }>();

  const [tx,       setTx]      = useState<TxDetail | null>(null);
  const [loading,  setLoading] = useState(true);
  const [sending,  setSending] = useState(false);
  const [printing, setPrinting]= useState(false);

  useEffect(() => {
    apiClient.get(`/wallet/transactions/${id}`)
      .then((r) => setTx(r.data))
      .catch(() => toast.error('Could not load transaction'))
      .finally(() => setLoading(false));
  }, [id]);

  async function sendEmailReceipt() {
    if (!tx) return;
    setSending(true);
    try {
      await apiClient.post(`/wallet/transactions/${tx.id}/receipt`);
      toast.success('Receipt sent!', `Sent to ${tx.user.email}`);
    } catch {
      toast.error('Could not send receipt');
    } finally {
      setSending(false);
    }
  }

  async function printReceipt() {
    if (!tx) return;
    setPrinting(true);
    try {
      await Print.printAsync({ html: buildReceiptHtml(tx) });
    } catch (err: any) {
      if (err?.message !== 'Printing did not complete') toast.error('Print failed');
    } finally {
      setPrinting(false);
    }
  }

  async function shareReceipt() {
    if (!tx) return;
    try {
      const { uri } = await Print.printToFileAsync({ html: buildReceiptHtml(tx) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'GruuvyPay Receipt' });
      } else {
        await Share.share({ message: buildReceiptText(tx) });
      }
    } catch {
      toast.error('Could not share receipt');
    }
  }

  if (loading) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ActivityIndicator size="large" color={theme.brand.primary} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  if (!tx) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.center}>
        <Text style={[textStyles.body, { color: theme.text.secondary }]}>Transaction not found</Text>
      </View>
    </SafeAreaView>
  );

  const statusColor = STATUS_COLORS[tx.status] ?? theme.text.muted;
  const statusIcon  = STATUS_ICONS[tx.status]  ?? 'help-circle';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status + amount card */}
        <View style={[styles.amountCard, { backgroundColor: theme.bg.secondary }]}>
          <Ionicons name={statusIcon as any} size={44} color={statusColor} />
          <Text style={[textStyles.h1, { color: theme.text.primary, marginTop: spacing[2] }]}>
            {tx.amount}
          </Text>
          <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[1] }]}>
            {tx.receipt.category}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[textStyles.labelSm, { color: statusColor }]}>{tx.status}</Text>
          </View>
        </View>

        {/* Electricity token — most prominent */}
        {tx.receipt.token && (
          <View style={[styles.tokenCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[textStyles.labelSm, { color: '#1D4ED8', letterSpacing: 1.5 }]}>
              ⚡ ELECTRICITY TOKEN
            </Text>
            <Text style={styles.tokenText}>
              {tx.receipt.token}
            </Text>
            <Text style={[textStyles.caption, { color: '#6B7280', marginTop: spacing[1] }]}>
              Enter this token on your prepaid meter
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: theme.bg.secondary }]}>
          {[
            { label: 'Date', value: new Date(tx.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) },
            tx.receipt.counterpart ? { label: tx.receipt.direction === 'debit' ? 'Sent To' : 'Received From', value: tx.receipt.counterpart, highlight: true } : null,
            tx.receipt.billersCode ? { label: tx.receipt.category === 'Electricity' ? 'Meter Number' : tx.receipt.category === 'Cable TV' ? 'Smartcard No.' : 'Phone Number', value: tx.receipt.billersCode, mono: true } : null,
            tx.receipt.product     ? { label: 'Product',    value: tx.receipt.product } : null,
            tx.receipt.coin        ? { label: 'Crypto',     value: `${tx.receipt.cryptoAmount} ${tx.receipt.coin}` } : null,
            tx.fee                 ? { label: 'Fee',        value: tx.fee } : null,
            tx.narration           ? { label: 'Narration',  value: tx.narration } : null,
            { label: 'Reference',   value: tx.reference, mono: true },
            tx.receipt.vtpassRef   ? { label: 'Provider Ref.', value: tx.receipt.vtpassRef, mono: true } : null,
          ].filter(Boolean).map((row: any, i) => (
            <View key={i} style={[styles.detailRow, { borderBottomColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{row.label}</Text>
              <Text style={[
                row.mono ? styles.monoText : textStyles.label,
                { color: row.highlight ? theme.brand.primary : theme.text.primary, textAlign: 'right', flex: 1, marginLeft: spacing[4] },
              ]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {[
            { icon: 'mail-outline',  label: sending  ? 'Sending...' : 'Email Receipt', onPress: sendEmailReceipt, loading: sending },
            { icon: 'print-outline', label: printing ? 'Printing...' : 'Print',        onPress: printReceipt,    loading: printing },
            { icon: 'share-outline', label: 'Share PDF',                                onPress: shareReceipt },
          ].map((btn, i) => (
            <TouchableOpacity
              key={i}
              onPress={btn.onPress}
              disabled={btn.loading}
              style={[styles.actionBtn, { backgroundColor: theme.bg.secondary }]}
              activeOpacity={0.7}
            >
              {btn.loading
                ? <ActivityIndicator size="small" color={theme.brand.primary} />
                : <Ionicons name={btn.icon as any} size={22} color={theme.brand.primary} />
              }
              <Text style={[textStyles.labelSm, { color: theme.brand.primary, marginTop: spacing[1] }]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[4] }]}>
          GruuvyPay — Secure Digital Payments
        </Text>
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function buildReceiptHtml(tx: TxDetail): string {
  const date = new Date(tx.createdAt).toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' });
  const sc   = STATUS_COLORS[tx.status] ?? '#6B7280';

  const tokenSection = tx.receipt.token ? `
    <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#1D4ED8;text-transform:uppercase;margin-bottom:8px">⚡ Electricity Token</div>
      <div style="font-size:28px;font-weight:700;color:#1B4FD8;letter-spacing:4px;font-family:monospace">${tx.receipt.token}</div>
      <div style="font-size:12px;color:#6B7280;margin-top:8px">Enter this token on your prepaid meter</div>
    </div>` : '';

  const rows = [
    ['Date', date],
    tx.receipt.counterpart ? [tx.receipt.direction === 'debit' ? 'Sent To' : 'Received From', tx.receipt.counterpart] : null,
    tx.receipt.billersCode ? [tx.receipt.category === 'Electricity' ? 'Meter Number' : tx.receipt.category === 'Cable TV' ? 'Smartcard No.' : 'Phone Number', tx.receipt.billersCode] : null,
    tx.receipt.product     ? ['Product',       tx.receipt.product] : null,
    tx.receipt.coin        ? ['Crypto',        `${tx.receipt.cryptoAmount} ${tx.receipt.coin}`] : null,
    tx.fee                 ? ['Fee',           tx.fee] : null,
    tx.narration           ? ['Narration',     tx.narration] : null,
    ['Reference', tx.reference],
    tx.receipt.vtpassRef   ? ['Provider Ref.', tx.receipt.vtpassRef] : null,
  ].filter(Boolean) as [string, string][];

  const rowsHtml = rows.map(([l, v]) =>
    `<tr><td style="padding:12px 16px;color:#6B7280;font-size:13px;border-bottom:1px solid #F3F4F6;white-space:nowrap">${l}</td><td style="padding:12px 16px;font-size:13px;font-weight:500;border-bottom:1px solid #F3F4F6;text-align:right">${v}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#f5f5f5;padding:20px}</style></head><body>
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
    <div style="background:#1B4FD8;padding:28px;text-align:center">
      <div style="font-size:22px;font-weight:700;color:#fff">Gruuvy<span style="color:#93C5FD">Pay</span></div>
      <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">Transaction Receipt</div>
    </div>
    <div style="text-align:center;padding:28px 40px 8px">
      <div style="font-size:36px;font-weight:700;color:#1a1a1a">${tx.amount}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:4px">${tx.receipt.category}</div>
      <div style="display:inline-block;margin-top:10px;padding:4px 14px;border-radius:999px;background:${sc}20;color:${sc};font-size:12px;font-weight:600">${tx.status}</div>
    </div>
    ${tokenSection}
    <div style="margin:8px 32px 28px"><table style="width:100%;border-collapse:collapse;border:1px solid #F3F4F6;border-radius:12px;overflow:hidden">${rowsHtml}</table></div>
    <div style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #F3F4F6">
      <p style="font-size:12px;color:#9CA3AF">${tx.user.name} &bull; ${tx.user.username}</p>
      <p style="font-size:12px;color:#9CA3AF;margin-top:4px">&copy; ${new Date().getFullYear()} GruuvyPay</p>
    </div>
  </div></body></html>`;
}

function buildReceiptText(tx: TxDetail): string {
  return [
    'GruuvyPay Receipt',
    '─────────────────',
    `${tx.receipt.category}: ${tx.amount}`,
    `Status: ${tx.status}`,
    tx.receipt.token    ? `\n⚡ TOKEN: ${tx.receipt.token}\nEnter on your prepaid meter` : '',
    tx.receipt.counterpart ? `To/From: ${tx.receipt.counterpart}` : '',
    tx.receipt.billersCode ? `Number: ${tx.receipt.billersCode}` : '',
    tx.receipt.product     ? `Product: ${tx.receipt.product}` : '',
    `Date: ${new Date(tx.createdAt).toLocaleString('en-NG')}`,
    `Ref: ${tx.reference}`,
    '─────────────────',
    'GruuvyPay — Secure Digital Payments',
  ].filter(Boolean).join('\n');
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  content:    { padding: spacing[4], gap: spacing[3] },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountCard: { borderRadius: radius['2xl'], padding: spacing[6], alignItems: 'center', gap: spacing[1] },
  statusBadge:{ paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, marginTop: spacing[2] },
  tokenCard:  { borderRadius: radius.xl, borderWidth: 1.5, padding: spacing[5], alignItems: 'center', gap: spacing[1] },
  tokenText:  { fontSize: 26, fontWeight: '700', letterSpacing: 4, fontFamily: 'monospace', marginTop: spacing[2], color: '#1B4FD8' },
  detailCard: { borderRadius: radius.xl, overflow: 'hidden' },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3.5], borderBottomWidth: StyleSheet.hairlineWidth },
  monoText:   { fontSize: 12, fontFamily: 'monospace' },
  actions:    { flexDirection: 'row', gap: spacing[3] },
  actionBtn:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[1], borderRadius: radius.xl, paddingVertical: spacing[4] },
});