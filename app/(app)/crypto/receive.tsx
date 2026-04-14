// Show Tatum deposit address for selected coin

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { cryptoApi, CryptoWallet } from '@/api/crypto.api';
import { useToast }  from '@/hooks/useToast';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B',
  SOL: '#9945FF', LTC: '#BFBBBB', XRP: '#00AAE4',
};

const COIN_WARNINGS: Record<string, string> = {
  USDT: 'Only send TRC-20 USDT to this address. Sending ERC-20 USDT will result in permanent loss.',
  XRP:  'This coin requires a destination tag. Always include the memo/tag when sending.',
  SOL:  'Only send SOL or SPL tokens to this address.',
};

export default function CryptoReceiveScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const coin       = symbol?.toUpperCase() ?? 'BTC';
  const coinColor  = COIN_COLORS[coin] ?? '#1B4FD8';

  const [wallet,  setWallet]  = useState<CryptoWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    cryptoApi.getWallet(coin)
      .then(setWallet)
      .catch(() => toast.error('Could not load wallet address'))
      .finally(() => setLoading(false));
  }, [coin]);

  async function copyAddress() {
    if (!wallet?.address) return;
    await Clipboard.setStringAsync(wallet.address);
    setCopied(true);
    toast.success('Copied!', 'Address copied to clipboard');
    setTimeout(() => setCopied(false), 3000);
  }

  async function shareAddress() {
    if (!wallet?.address) return;
    await Share.share({
      message: `My ${coin} deposit address:\n${wallet.address}${wallet.memo ? `\nMemo/Tag: ${wallet.memo}` : ''}`,
    });
  }

  const warning = COIN_WARNINGS[coin];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Receive {coin}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.brand.primary} style={{ marginTop: spacing[10] }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Warning banner */}
          {warning && (
            <View style={[styles.warningBanner, { backgroundColor: theme.status.warning + '15', borderColor: theme.status.warning + '40' }]}>
              <Ionicons name="warning-outline" size={18} color={theme.status.warning} />
              <Text style={[textStyles.bodySm, { color: theme.status.warning, flex: 1 }]}>
                {warning}
              </Text>
            </View>
          )}

          {/* QR Code */}
          {wallet?.address && (
            <View style={[styles.qrCard, { backgroundColor: '#fff' }]}>
              <QRCode value={wallet.address} size={200} color="#000" backgroundColor="#fff" />
              <Text style={[textStyles.caption, { color: '#666', marginTop: spacing[3], textAlign: 'center' }]}>
                Scan to get {coin} deposit address
              </Text>
            </View>
          )}

          {/* Address display */}
          <View style={[styles.addressCard, { backgroundColor: theme.bg.secondary }]}>
            <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
              {coin} DEPOSIT ADDRESS
            </Text>
            <Text style={[textStyles.body, { color: theme.text.primary, marginTop: spacing[2], fontFamily: 'monospace' }]} selectable>
              {wallet?.address ?? '—'}
            </Text>
          </View>

          {/* XRP memo/tag */}
          {wallet?.memo && (
            <View style={[styles.addressCard, { backgroundColor: theme.status.warning + '10', borderColor: theme.status.warning + '30', borderWidth: 1 }]}>
              <Text style={[textStyles.labelSm, { color: theme.status.warning, letterSpacing: 0.8 }]}>
                DESTINATION TAG (REQUIRED)
              </Text>
              <Text style={[textStyles.h3, { color: theme.status.warning, marginTop: spacing[2] }]} selectable>
                {wallet.memo}
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>
                You MUST include this tag when sending XRP. Transfers without this tag will be lost.
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={copyAddress}
              style={[styles.actionBtn, { backgroundColor: copied ? theme.status.success + '20' : theme.bg.secondary }]}
            >
              <Ionicons
                name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                size={22}
                color={copied ? theme.status.success : theme.text.primary}
              />
              <Text style={[textStyles.label, { color: copied ? theme.status.success : theme.text.primary }]}>
                {copied ? 'Copied!' : 'Copy Address'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareAddress}
              style={[styles.actionBtn, { backgroundColor: theme.bg.secondary }]}
            >
              <Ionicons name="share-outline" size={22} color={theme.text.primary} />
              <Text style={[textStyles.label, { color: theme.text.primary }]}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Network info */}
          <View style={[styles.networkInfo, { backgroundColor: theme.bg.secondary }]}>
            <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
              Network Info
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.text.secondary }]}>
              Network: <Text style={{ color: coinColor }}>{wallet?.network?.toUpperCase()}</Text>
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginTop: spacing[1] }]}>
              Minimum deposit: 0.0001 {coin}
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginTop: spacing[1] }]}>
              Confirmations required: {coin === 'BTC' ? '3' : coin === 'ETH' ? '12' : '1'}
            </Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  content:       { padding: spacing[4], gap: spacing[4] },
  warningBanner: { flexDirection: 'row', gap: spacing[2], borderRadius: radius.lg, borderWidth: 1, padding: spacing[3] },
  qrCard:        { alignItems: 'center', borderRadius: radius['2xl'], padding: spacing[6] },
  addressCard:   { borderRadius: radius.xl, padding: spacing[4], gap: spacing[1] },
  actions:       { flexDirection: 'row', gap: spacing[3] },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing[1.5], borderRadius: radius.xl, paddingVertical: spacing[4],
  },
  networkInfo: { borderRadius: radius.xl, padding: spacing[4] },
});