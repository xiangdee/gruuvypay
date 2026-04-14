import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Input }  from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import {
  BillScreen, ProviderGrid,
  ConfirmSummary, BillPinStep, BillSuccess,
} from '@/components/bills/BillScreenLayout';
import { useTheme, spacing } from '@/theme';
import { useBillPayment } from '@/screens/app/bills/useBillPayment';
import { AIRTIME_PROVIDERS } from '@/config/bills.config';

const QUICK_AMOUNTS = ['50', '100', '200', '500', '1000', '2000'];

export default function AirtimeScreen() {
  const { theme } = useTheme();
  const [provider, setProvider] = useState('mtn');

  const {
    step, billersCode, setBillersCode,
    amount, setAmount, phone, setPhone,
    formError, loading, pinError, pinRef,
    result, proceedToConfirm, proceedToPin,
    onPinComplete, goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: provider });

  const selectedProvider = AIRTIME_PROVIDERS.find((p) => p.id === provider);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Airtime" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'Network',     value: selectedProvider?.name ?? provider },
            { label: 'Phone',       value: billersCode },
            { label: 'Amount',      value: `₦${parseFloat(amount).toLocaleString()}`, highlight: true },
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
        <BillPinStep onComplete={onPinComplete} pinRef={pinRef} loading={loading} onBack={goBack} />
      </BillScreen>
    );
  }

  if (step === 'success' && result) {
    return (
      <BillScreen title="Done">
        <BillSuccess
          title="Airtime Sent!"
          subtitle={`₦${parseFloat(amount).toLocaleString()} airtime sent to ${billersCode}`}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Buy Airtime" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Network selection */}
        <ProviderGrid
          providers={AIRTIME_PROVIDERS}
          selected={provider}
          onSelect={setProvider}
        />

        <View style={styles.form}>
          {formError ? <ErrorCard message={formError} style={styles.error} /> : null}

          <Input
            label="Phone Number"
            placeholder="08012345678"
            keyboardType="phone-pad"
            value={billersCode}
            onChangeText={setBillersCode}
            maxLength={11}
          />

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <Button
                key={q}
                label={`₦${q}`}
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
            style={styles.cta}
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
  cta:      { marginTop: spacing[2] },
});