import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PinInput } from '@/components/ui/PinInput';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useSendMoney } from '@/screens/app/useSendMoney';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { walletApi } from '@/api/wallet.api';
import { useToast } from '@/hooks/useToast';
import { useBiometricPin } from '@/hooks/useBiometricPin';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function SendMoneyScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const [sendMethod, setSendMethod] = useState<'tag' | 'bank'>('tag');
  const {
    step, tag, setTag, tagError,
    recipient, amount, setAmount, amountError,
    narration, setNarration, loading,
    pinError, pinRef, txRef, wallet,
    QUICK_AMOUNTS, lookupTag, proceedToPin,
    onPinComplete, setQuickAmount, goBack,
    sendAnother, goHome, getTierInfo,
  } = useSendMoney();

  // ── Bank flow state ──────────────────────────────────────────────────
  const [bankStep, setBankStep]               = useState<'details' | 'amount' | 'pin' | 'success'>('details');
  const [banks, setBanks]                     = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [banksLoading, setBanksLoading]       = useState(false);
  const [showPicker, setShowPicker]           = useState(false);
  const [bankSearch, setBankSearch]           = useState('');
  const [selectedBank, setSelectedBank]       = useState<{ code: string; name: string } | null>(null);
  const [bankAccNumber, setBankAccNumber]     = useState('');
  const [verifiedAcc, setVerifiedAcc]         = useState<{ accountNumber: string; accountName: string } | null>(null);
  const [verifying, setVerifying]             = useState(false);
  const [verifyError, setVerifyError]         = useState('');
  const [bankAmount, setBankAmount]           = useState('');
  const [bankAmountError, setBankAmountError] = useState('');
  const [bankNarration, setBankNarration]     = useState('');
  const [bankLoading, setBankLoading]         = useState(false);
  const [bankPinError, setBankPinError]       = useState(false);
  const [bankTxRef, setBankTxRef]             = useState('');
  const bankPinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const bankIdempotencyKey = useRef(uuidv4());
  const { showBiometrics: showBioBankPin, onBiometrics: onBioBankPin } = useBiometricPin(onBankPinComplete);
  const { showBiometrics: showBioTagPin,  onBiometrics: onBioTagPin  } = useBiometricPin(onPinComplete);

  useEffect(() => {
    if (sendMethod === 'bank' && banks.length === 0) loadBanks();
  }, [sendMethod]);

  async function loadBanks() {
    setBanksLoading(true);
    try {
      const result = await walletApi.getBanks();
      setBanks(result);
    } catch {
      toast.error('Could not load bank list');
    } finally {
      setBanksLoading(false);
    }
  }

  async function verifyBankAccount() {
    if (!selectedBank || bankAccNumber.length < 10) return;
    setVerifyError('');
    setVerifiedAcc(null);
    setVerifying(true);
    try {
      const result = await walletApi.verifyBankAccount(bankAccNumber, selectedBank.code);
      setVerifiedAcc(result);
    } catch (err: any) {
      setVerifyError(err?.response?.data?.message ?? 'Could not verify account');
    } finally {
      setVerifying(false);
    }
  }

  function proceedToBankAmount() {
    if (!verifiedAcc) return;
    setBankAmountError('');
    setBankStep('amount');
  }

  function proceedToBankPin() {
    const n = parseFloat(bankAmount);
    if (!bankAmount || isNaN(n) || n <= 0) {
      setBankAmountError('Enter a valid amount');
      return;
    }
    setBankAmountError('');
    setBankStep('pin');
  }

  async function onBankPinComplete(pin: string) {
    setBankPinError(false);
    setBankLoading(true);
    try {
      const result = await walletApi.sendToBank({
        accountBank:    selectedBank!.code,
        accountNumber:  bankAccNumber,
        accountName:    verifiedAcc!.accountName,
        amountNaira:    bankAmount,
        narration:      bankNarration || undefined,
        pin,
        idempotencyKey: bankIdempotencyKey.current,
      });
      setBankTxRef(result.reference);
      setBankStep('success');
    } catch (err: any) {
      setBankPinError(true);
      bankPinRef.current?.shake();
      toast.error(err?.response?.data?.message ?? 'Transfer failed');
    } finally {
      setBankLoading(false);
    }
  }

  function resetBankFlow() {
    setBankStep('details');
    setSelectedBank(null);
    setBankAccNumber('');
    setVerifiedAcc(null);
    setVerifyError('');
    setBankAmount('');
    setBankAmountError('');
    setBankNarration('');
    setBankPinError(false);
    setBankTxRef('');
    bankIdempotencyKey.current = uuidv4();
  }

  function handleBankBack() {
    if (bankStep === 'details') goBack();
    else if (bankStep === 'amount') setBankStep('details');
    else if (bankStep === 'pin') setBankStep('amount');
    else goBack();
  }

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.includes(bankSearch),
  );

  // ── Inline verify element for the account number input ───────────────
  function VerifyAction() {
    if (verifying) {
      return <ActivityIndicator size="small" color={theme.brand.primary} />;
    }
    if (verifiedAcc) {
      return <Ionicons name="checkmark-circle" size={20} color={theme.status.success} />;
    }
    if (bankAccNumber.length === 10 && selectedBank) {
      return (
        <TouchableOpacity
          onPress={verifyBankAccount}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[textStyles.label, { color: verifyError ? theme.status.error : theme.brand.primary }]}>
            {verifyError ? 'Retry' : 'Verify'}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  // ── Bank flow rendering ───────────────────────────────────────────────
  if (sendMethod === 'bank') {

    if (bankStep === 'success') {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
          <View style={[styles.screen, styles.successScreen]}>
            <View style={[styles.successIcon, { backgroundColor: theme.status.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
            </View>
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
              Transfer Initiated!
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
              ₦{parseFloat(bankAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} to {verifiedAcc?.accountName}
            </Text>
            <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[2], textAlign: 'center' }]}>
              Bank transfers typically settle within minutes.{'\n'}Ref: {bankTxRef}
            </Text>
            <View style={styles.successActions}>
              <Button label="Send Again" onPress={resetBankFlow} variant="secondary" />
              <Button label="Go to Home" onPress={goHome}        variant="primary"   />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    if (bankStep === 'pin') {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
          <View style={styles.screen}>
            <LoadingOverlay visible={bankLoading} message="Sending..." />
            <Header title="Confirm Transfer" onBack={handleBankBack} theme={theme} />
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
              <SummaryRow label="To"     value={verifiedAcc?.accountName ?? ''} theme={theme} />
              <SummaryRow label="Bank"   value={selectedBank?.name ?? ''}       theme={theme} />
              <SummaryRow label="Acct"   value={bankAccNumber}                   theme={theme} />
              <SummaryRow label="Amount" value={`₦${parseFloat(bankAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} theme={theme} highlight />
              {bankNarration ? <SummaryRow label="Note" value={bankNarration} theme={theme} /> : null}
            </View>
            <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginBottom: spacing[8] }]}>
              Enter your PIN to confirm
            </Text>
            <PinInput
              onComplete={onBankPinComplete}
              error={bankPinError}
              onRef={(api) => { bankPinRef.current = api; }}
              showBiometrics={showBioBankPin}
              onBiometrics={onBioBankPin}
              style={{ flex: 1 }}
            />
          </View>
        </SafeAreaView>
      );
    }

    if (bankStep === 'amount') {
      const balanceNaira = (parseInt(wallet.balanceRaw ?? '0') / 100).toFixed(2);
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
          <KeyboardView scrollable>
            <View style={styles.screen}>
              <Header title="Bank Withdrawal" onBack={handleBankBack} theme={theme} />

              <View style={[styles.recipientCard, { backgroundColor: theme.bg.secondary }]}>
                <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
                  <Ionicons name="business-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>
                    {verifiedAcc?.accountName}
                  </Text>
                  <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>
                    {selectedBank?.name} · {bankAccNumber}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setBankStep('details')} style={styles.changeBtn}>
                  <Text style={[textStyles.labelSm, { color: theme.text.link }]}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.amountCard, { backgroundColor: theme.bg.secondary }]}>
                <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
                  AMOUNT (NGN)
                </Text>
                <View style={styles.amountRow}>
                  <Text style={[textStyles.h2, { color: theme.text.secondary }]}>₦</Text>
                  <TextInput
                    value={bankAmount}
                    onChangeText={(v) => { setBankAmount(v.replace(/[^0-9.]/g, '')); setBankAmountError(''); }}
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
                    Max: {getTierInfo().maxSend}
                  </Text>
                </View>
                {bankAmountError ? (
                  <Text style={[textStyles.caption, { color: theme.status.error, marginTop: spacing[1] }]}>
                    {bankAmountError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => setBankAmount(q.replace(',', ''))}
                    style={[
                      styles.quickChip,
                      { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT },
                      bankAmount === q.replace(',', '') && {
                        borderColor: theme.brand.primary,
                        backgroundColor: theme.brand.primary + '15',
                      },
                    ]}
                  >
                    <Text style={[
                      textStyles.labelSm,
                      { color: bankAmount === q.replace(',', '') ? theme.brand.primary : theme.text.secondary },
                    ]}>
                      ₦{q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                placeholder="Add a note (optional)"
                value={bankNarration}
                onChangeText={setBankNarration}
                leftIcon={<Ionicons name="chatbubble-outline" size={18} color={theme.text.muted} />}
                maxLength={50}
              />

              <View style={styles.cta}>
                <Button label="Continue" onPress={proceedToBankPin} disabled={!bankAmount} />
              </View>
            </View>
          </KeyboardView>
        </SafeAreaView>
      );
    }

    // Details step
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <KeyboardView scrollable>
          <View style={styles.screen}>
            <Header title="Bank Withdrawal" onBack={handleBankBack} theme={theme} />

            <View style={[styles.methodTabs, { backgroundColor: theme.bg.secondary }]}>
              {(['tag', 'bank'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSendMethod(m)}
                  style={[styles.methodTab, m === 'bank' && { backgroundColor: theme.brand.primary }]}
                >
                  <Ionicons
                    name={m === 'tag' ? 'at-outline' : 'business-outline'}
                    size={15}
                    color={m === 'bank' ? '#000' : theme.text.muted}
                  />
                  <Text style={[textStyles.labelSm, { color: m === 'bank' ? '#000' : theme.text.muted }]}>
                    {m === 'tag' ? 'GruuvyTag' : 'Bank Withdrawal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.body}>
              <Text style={[textStyles.h2, { color: theme.text.primary, marginBottom: spacing[2] }]}>
                Enter bank details
              </Text>
              <Text style={[textStyles.body, { color: theme.text.secondary, marginBottom: spacing[6] }]}>
                Transfer to any Nigerian bank account
              </Text>

              {/* Bank selector */}
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={[styles.bankSelector, { backgroundColor: theme.bg.input, borderColor: theme.border.DEFAULT }]}
              >
                <Ionicons name="business-outline" size={20} color={theme.text.muted} style={{ marginRight: spacing[3] }} />
                <Text style={[textStyles.body, { color: selectedBank ? theme.text.primary : theme.text.muted, flex: 1 }]}>
                  {selectedBank ? selectedBank.name : 'Select bank'}
                </Text>
                {banksLoading
                  ? <ActivityIndicator size="small" color={theme.text.muted} />
                  : <Ionicons name="chevron-down-outline" size={18} color={theme.text.muted} />
                }
              </TouchableOpacity>

              {/* Account number with inline verify */}
              <View style={{ marginTop: spacing[3] }}>
                <Input
                  placeholder="Account number (10 digits)"
                  value={bankAccNumber}
                  onChangeText={(v) => {
                    setBankAccNumber(v.replace(/\D/g, '').slice(0, 10));
                    setVerifiedAcc(null);
                    setVerifyError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="done"
                  leftIcon={<Ionicons name="card-outline" size={20} color={theme.text.muted} />}
                  //@ts-ignore
                  rightElement={<VerifyAction />}
                  error={verifyError || undefined}
                />
              </View>

              {/* Verified account name */}
              {verifiedAcc && (
                <View style={[styles.verifiedCard, { backgroundColor: theme.status.success + '15', borderColor: theme.status.success + '40' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.status.success} />
                  <Text style={[textStyles.label, { color: theme.status.success, flex: 1 }]}>
                    {verifiedAcc.accountName}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cta}>
              <Button label="Continue" onPress={proceedToBankAmount} disabled={!verifiedAcc} />
            </View>
          </View>
        </KeyboardView>

        {/* Bank picker modal */}
        <Modal visible={showPicker} animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearch}>
              <Input
                placeholder="Search banks..."
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
                leftIcon={<Ionicons name="search-outline" size={18} color={theme.text.muted} />}
              />
            </View>
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBank({ code: item.code, name: item.name });
                    setVerifiedAcc(null);
                    setBankSearch('');
                    setShowPicker(false);
                  }}
                  style={[styles.bankItem, { borderBottomColor: theme.border.DEFAULT }]}
                >
                  <Text style={[textStyles.body, { color: theme.text.primary }]}>{item.name}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{item.code}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: spacing[10] }}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Tag flow: Step 1 ──────────────────────────────────────────────────
  if (step === 'tag') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <KeyboardView scrollable>
          <View style={styles.screen}>
            <Header title="Send Money" onBack={goBack} theme={theme} />

            <View style={[styles.methodTabs, { backgroundColor: theme.bg.secondary }]}>
              {(['tag', 'bank'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSendMethod(m)}
                  style={[styles.methodTab, sendMethod === m && { backgroundColor: theme.brand.primary }]}
                >
                  <Ionicons
                    name={m === 'tag' ? 'at-outline' : 'business-outline'}
                    size={15}
                    color={sendMethod === m ? '#000' : theme.text.muted}
                  />
                  <Text style={[textStyles.labelSm, { color: sendMethod === m ? '#000' : theme.text.muted }]}>
                    {m === 'tag' ? 'GruuvyTag' : 'Bank Withdrawal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                onChangeText={setTag}
                error={tagError}
                leftIcon={<Ionicons name="at" size={20} color={theme.text.muted} />}
                returnKeyType="search"
                onSubmitEditing={lookupTag}
              />
            </View>

            <View style={styles.cta}>
              <Button label="Find User" onPress={lookupTag} loading={loading} disabled={!tag.trim()} />
            </View>
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }

  // ── Tag flow: Step 2 — Amount ─────────────────────────────────────────
  if (step === 'amount') {
    const balanceNaira = (parseInt(wallet.balanceRaw ?? '0') / 100).toFixed(2);
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <KeyboardView scrollable>
          <View style={styles.screen}>
            <Header title="Send Money" onBack={goBack} theme={theme} />

            <View style={[styles.recipientCard, { backgroundColor: theme.bg.secondary }]}>
              <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
                <Text style={[textStyles.h3, { color: '#fff' }]}>{recipient?.name[0]}</Text>
              </View>
              <View>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>{recipient?.name}</Text>
                <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{recipient?.username}</Text>
              </View>
              <TouchableOpacity onPress={goBack} style={styles.changeBtn}>
                <Text style={[textStyles.labelSm, { color: theme.text.link }]}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.amountCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
                AMOUNT (NGN)
              </Text>
              <View style={styles.amountRow}>
                <Text style={[textStyles.h2, { color: theme.text.secondary }]}>₦</Text>
                <TextInput
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
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

            <Input
              placeholder="Add a note (optional)"
              value={narration}
              onChangeText={setNarration}
              leftIcon={<Ionicons name="chatbubble-outline" size={18} color={theme.text.muted} />}
              maxLength={50}
            />

            <View style={styles.cta}>
              <Button label="Continue" onPress={proceedToPin} disabled={!amount} />
            </View>
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }

  // ── Tag flow: Step 3 — PIN ────────────────────────────────────────────
  if (step === 'pin') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.screen}>
          <LoadingOverlay visible={loading} message="Sending..." />
          <Header title="Confirm Transfer" onBack={goBack} theme={theme} />
          <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
            <SummaryRow label="To"     value={`${recipient?.name} (${recipient?.username})`} theme={theme} />
            <SummaryRow label="Amount" value={`₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} theme={theme} highlight />
            {narration ? <SummaryRow label="Note" value={narration} theme={theme} /> : null}
          </View>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginBottom: spacing[8] }]}>
            Enter your PIN to confirm
          </Text>
          <PinInput
            onComplete={onPinComplete}
            error={pinError}
            onRef={(api) => { pinRef.current = api; }}
            showBiometrics={showBioTagPin}
            onBiometrics={onBioTagPin}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Tag flow: Step 4 — Success ────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={[styles.screen, styles.successScreen]}>
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
          <Button label="Send Again" onPress={sendAnother} variant="secondary" />
          <Button label="Go to Home" onPress={goHome}      variant="primary"   />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
  safe:   { flex: 1 },
  screen: { flex: 1, paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: spacing[4],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body:    { flex: 1, paddingTop: spacing[4] },
  cta:     { paddingVertical: spacing[5] },

  recipientCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[4],
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  changeBtn: { marginLeft: 'auto' },

  amountCard: {
    borderRadius: radius.xl, padding: spacing[4],
    marginBottom: spacing[4], gap: spacing[2],
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing[2], marginBottom: spacing[4],
  },
  quickChip: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1.5],
    borderRadius: radius.full, borderWidth: 1,
  },

  summaryCard: {
    borderRadius: radius.xl, padding: spacing[4],
    marginBottom: spacing[6], gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: spacing[4],
  },

  successScreen:  { alignItems: 'center', justifyContent: 'center' },
  successIcon:    { width: 120, height: 120, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  successActions: { width: '100%', gap: spacing[3], marginTop: spacing[10] },

  methodTabs: {
    flexDirection: 'row', borderRadius: radius.full,
    padding: spacing[1], marginHorizontal: spacing[4], marginBottom: spacing[4],
  },
  methodTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[1.5],
    paddingVertical: spacing[2.5], borderRadius: radius.full,
  },

  bankSelector: {
    height: 56, borderRadius: radius.xl, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4],
  },
  verifiedCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: radius.xl, borderWidth: 1, padding: spacing[3], marginTop: spacing[3],
  },

  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1,
  },
  pickerSearch: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  bankItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 0.5,
  },
});
