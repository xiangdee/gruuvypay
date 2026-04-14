import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Input }     from '@/components/ui/Input';
import { Button }    from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import {
  BillScreen, ProviderGrid,
  ConfirmSummary, BillPinStep, BillSuccess,
} from '@/components/bills/BillScreenLayout';
import { useTheme, spacing } from '@/theme';
import { useBillPayment } from '@/screens/app/bills/useBillPayment';

const BETTING_PROVIDERS = [
  { id: 'bet9ja',    name: 'Bet9ja',    logo: '🟢', color: '#00AA00' },
  { id: 'betway',    name: 'Betway',    logo: '⚽', color: '#009900' },
  { id: 'sportybet', name: 'SportyBet', logo: '🏆', color: '#FF0000' },
  { id: '1xbet',     name: '1xBet',     logo: '🎯', color: '#1C3F6E' },
  { id: 'nairabet',  name: 'NairaBet',  logo: '👑', color: '#003399' },
  { id: 'betking',   name: 'BetKing',   logo: '🔵', color: '#004B87' },
];

const QUICK_AMOUNTS = ['500', '1000', '2000', '5000', '10000', '20000'];

export default function BettingScreen() {
  const { theme }    = useTheme();
  const [provider,   setProvider] = useState('bet9ja');

  const {
    step, billersCode, setBillersCode,
    amount, setAmount, phone, setPhone,
    formError, loading, pinError, pinRef,
    result, proceedToConfirm, proceedToPin,
    onPinComplete, goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: provider });

  const selectedProvider = BETTING_PROVIDERS.find((p) => p.id === provider);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Top-Up" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'Platform',  value: selectedProvider?.name ?? provider },
            { label: 'User ID',   value: billersCode },
            { label: 'Amount',    value: `₦${parseFloat(amount).toLocaleString()}`, highlight: true },
          ]}
          onConfirm={proceedToPin}
          onBack={goBack}
        />
      </BillScreen>
    );
  }

  if (step === 'pin') {
    return (
      <BillScreen title="Enter PIN" onBack={goBack}>
        <BillPinStep
          onComplete={onPinComplete}
          pinRef={pinRef}
          loading={loading}
          onBack={goBack}
        />
      </BillScreen>
    );
  }

  if (step === 'success' && result) {
    return (
      <BillScreen title="Done">
        <BillSuccess
          title="Account Funded!"
          subtitle={`₦${parseFloat(amount).toLocaleString()} added to ${selectedProvider?.name} account ${billersCode}`}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Betting Top-Up" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProviderGrid
          providers={BETTING_PROVIDERS}
          selected={provider}
          onSelect={setProvider}
        />

        <View style={styles.form}>
          {formError ? <ErrorCard message={formError} style={styles.error} /> : null}

          <Input
            label="User ID / Username"
            placeholder="Enter your betting account ID"
            autoCapitalize="none"
            autoCorrect={false}
            value={billersCode}
            onChangeText={setBillersCode}
          />

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <Button
                key={q}
                label={`₦${parseInt(q).toLocaleString()}`}
                variant={amount === q ? 'primary' : 'secondary'}
                onPress={() => setAmount(q)}
                style={styles.quickBtn}
              />
            ))}
          </View>

          <Input
            label="Amount (NGN)"
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Button
            label="Continue"
            onPress={proceedToConfirm}
            disabled={!billersCode || !amount}
          />
        </View>
      </ScrollView>
    </BillScreen>
  );
}

const styles = StyleSheet.create({
  form:     { padding: spacing[4], gap: spacing[4] },
  error:    { marginBottom: spacing[2] },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  quickBtn: { flexBasis: '30%' },
});