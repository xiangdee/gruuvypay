import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Input }     from '@/components/ui/Input';
import { Button }    from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import {
  BillScreen, ProviderGrid,
  ConfirmSummary, BillPinStep, BillSuccess,
} from '@/components/bills/BillScreenLayout';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useBillPayment } from '@/screens/app/bills/useBillPayment';

// VTpass serviceIDs for airtime-to-cash
const AIRTIME_CASH_PROVIDERS = [
  { id: 'mtn-airtime-to-cash',     name: 'MTN',     logo: '📱', color: '#FFCC00' },
  { id: 'airtel-airtime-to-cash',  name: 'Airtel',  logo: '📡', color: '#E40000' },
  { id: 'glo-airtime-to-cash',     name: 'Glo',     logo: '🟢', color: '#007A00' },
  { id: 'etisalat-airtime-to-cash',name: '9mobile', logo: '💚', color: '#00A651' },
];

// VTpass typically pays out 80% of airtime value
const PAYOUT_RATE = 0.8;

export default function AirtimeToCashScreen() {
  const { theme }  = useTheme();
  const [provider, setProvider] = useState('mtn-airtime-to-cash');

  const {
    step, billersCode, setBillersCode,
    amount, setAmount, phone, setPhone,
    formError, loading, pinError, pinRef,
    result, proceedToConfirm, proceedToPin,
    onPinComplete, goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: provider });

  const selectedProvider = AIRTIME_CASH_PROVIDERS.find((p) => p.id === provider);

  // Calculate payout based on entered airtime amount
  const airtimeAmount = parseFloat(amount) || 0;
  const payoutAmount  = (airtimeAmount * PAYOUT_RATE).toFixed(2);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Conversion" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'Network',         value: selectedProvider?.name ?? provider },
            { label: 'Phone Number',    value: billersCode },
            { label: 'Airtime Amount',  value: `₦${airtimeAmount.toLocaleString()}` },
            { label: 'You Receive',     value: `₦${parseFloat(payoutAmount).toLocaleString()}`, highlight: true },
            { label: 'Rate',            value: `${PAYOUT_RATE * 100}% of airtime value` },
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
          title="Conversion Successful!"
          subtitle={`₦${parseFloat(payoutAmount).toLocaleString()} has been credited to your GruuvyPay wallet`}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Airtime to Cash" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Network selection */}
        <ProviderGrid
          providers={AIRTIME_CASH_PROVIDERS}
          selected={provider}
          onSelect={setProvider}
        />

        <View style={styles.form}>
          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: theme.brand.primary + '15', borderColor: theme.brand.primary + '30' }]}>
            <Text style={[textStyles.bodySm, { color: theme.brand.primary }]}>
              Convert your airtime to cash at {PAYOUT_RATE * 100}% of the airtime value.
              Minimum ₦100, maximum ₦50,000 per transaction.
            </Text>
          </View>

          {formError ? <ErrorCard message={formError} /> : null}

          <Input
            label="Phone Number"
            placeholder="08012345678"
            keyboardType="phone-pad"
            value={billersCode}
            onChangeText={setBillersCode}
            maxLength={11}
          />

          <Input
            label="Airtime Amount (NGN)"
            placeholder="Enter airtime amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Live payout preview */}
          {airtimeAmount > 0 && (
            <View style={[styles.payoutCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>
                You will receive
              </Text>
              <Text style={[textStyles.h2, { color: theme.status.success }]}>
                ₦{parseFloat(payoutAmount).toLocaleString()}
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                Credited to your GruuvyPay wallet instantly
              </Text>
            </View>
          )}

          <Button
            label="Convert Airtime"
            onPress={proceedToConfirm}
            disabled={!billersCode || !amount || airtimeAmount < 100}
          />
        </View>
      </ScrollView>
    </BillScreen>
  );
}

const styles = StyleSheet.create({
  form:       { padding: spacing[4], gap: spacing[4] },
  infoBanner: {
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing[3],
  },
  payoutCard: {
    borderRadius: radius.xl,
    padding:      spacing[4],
    alignItems:   'center',
    gap:          spacing[1],
  },
});