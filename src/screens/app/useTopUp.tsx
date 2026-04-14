// src/screens/app/useTopUp.tsx

import { useEffect, useState, useCallback } from 'react';
import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVirtualAccount } from '@/store/slices/wallet.slice';
import { useToast } from '@/hooks/useToast';

export function useTopUp() {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const wallet   = useAppSelector((s) => s.wallet);
  const user     = useAppSelector((s) => s.auth.user);

  const [copied,    setCopied]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const va = wallet.virtualAccount;

  useEffect(() => {
    if (!va) dispatch(fetchVirtualAccount());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchVirtualAccount());
    setRefreshing(false);
  }, [dispatch]);

  async function copyAccountNumber() {
    if (!va?.accountNumber) return;
    await Clipboard.setStringAsync(va.accountNumber);
    setCopied(true);
    toast.success('Copied!', 'Account number copied to clipboard');
    setTimeout(() => setCopied(false), 3000);
  }

  async function shareAccountDetails() {
    if (!va) return;
    try {
      await Share.share({
        message: [
          `Send money to my GruuvyPay wallet:`,
          `Bank: ${va.bankName}`,
          `Account Number: ${va.accountNumber}`,
          `Account Name: ${va.accountName}`,
          ``,
          `Powered by GruuvyPay`,
        ].join('\n'),
        title: 'My GruuvyPay Account',
      });
    } catch {}
  }

  // QR code value — standard format for bank transfer QR codes
  const qrValue = va
    ? JSON.stringify({
        bankName:      va.bankName,
        accountNumber: va.accountNumber,
        accountName:   va.accountName,
      })
    : '';

  return {
    va,
    user,
    wallet,
    copied,
    refreshing,
    qrValue,
    copyAccountNumber,
    shareAccountDetails,
    onRefresh,
    loading: wallet.vaLoading,
  };
}