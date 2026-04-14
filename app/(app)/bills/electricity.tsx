import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Input }    from '@/components/ui/Input';
import { Button }   from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import {
  BillScreen, ProviderGrid,
  ConfirmSummary, BillPinStep, BillSuccess,
} from '@/components/bills/BillScreenLayout';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useBillPayment } from '@/screens/app/bills/useBillPayment';
import { ELECTRICITY_PROVIDERS, METER_TYPES } from '@/config/bills.config';

const QUICK_AMOUNTS = ['1000', '2000', '5000', '10000', '20000', '50000'];

export default function ElectricityScreen() {
  const { theme }    = useTheme();
  const [provider,   setProvider]   = useState('ikeja-electric');
  const [meterType,  setMeterType]  = useState('prepaid');

  const {
    step, billersCode, setBillersCode,
    amount, setAmount, customerInfo,
    formError, loading, verifying,
    pinError, pinRef, result,
    verifyCustomer, proceedToConfirm, proceedToPin,
    onPinComplete, goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: `${provider}-${meterType}` });

  const selectedProvider = ELECTRICITY_PROVIDERS.find((p) => p.id === provider);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Payment" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'DISCO',     value: selectedProvider?.name ?? provider },
            { label: 'Meter',     value: billersCode },
            { label: 'Type',      value: meterType },
            { label: 'Customer',  value: customerInfo?.Customer_Name ?? '—' },
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
        <BillPinStep onComplete={onPinComplete} pinRef={pinRef} loading={loading} onBack={goBack} />
      </BillScreen>
    );
  }

  if (step === 'success' && result) {
    return (
      <BillScreen title="Done">
        <BillSuccess
          title="Electricity Purchased!"
          subtitle={`₦${parseFloat(amount).toLocaleString()} units added to meter ${billersCode}`}
          token={result.token}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Pay Electricity" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DISCO selection */}
        <ProviderGrid
          providers={ELECTRICITY_PROVIDERS}
          selected={provider}
          onSelect={setProvider}
        />

        <View style={styles.form}>
          {/* Meter type toggle */}
          <View style={[styles.toggleRow, { backgroundColor: theme.bg.secondary }]}>
            {METER_TYPES.map((mt) => (
              <TouchableOpacity
                key={mt.code}
                onPress={() => setMeterType(mt.code)}
                style={[
                  styles.toggleBtn,
                  meterType === mt.code && { backgroundColor: theme.brand.primary },
                ]}
              >
                <Text style={[
                  textStyles.label,
                  { color: meterType === mt.code ? '#fff' : theme.text.secondary },
                ]}>
                  {mt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formError ? <ErrorCard message={formError} /> : null}

          {/* Meter number + verify */}
          <View style={styles.meterRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Meter Number"
                placeholder="Enter meter number"
                keyboardType="numeric"
                value={billersCode}
                onChangeText={setBillersCode}
              />
            </View>
            <Button
              label={verifying ? '...' : 'Verify'}
              onPress={verifyCustomer}
              loading={verifying}
              variant="secondary"
              style={styles.verifyBtn}
            />
          </View>

          {/* Customer info after verification */}
          {customerInfo && (
            <View style={[styles.customerCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                {customerInfo.Customer_Name}
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                {customerInfo.Address ?? ''}
              </Text>
            </View>
          )}

          {/* Quick amounts */}
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
            placeholder="Minimum ₦1,000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Button
            label="Continue"
            onPress={proceedToConfirm}
            disabled={!billersCode || !amount || !customerInfo}
          />
        </View>
      </ScrollView>
    </BillScreen>
  );
}

const styles = StyleSheet.create({
  form:        { padding: spacing[4], gap: spacing[4] },
  toggleRow:   { flexDirection: 'row', borderRadius: radius.xl, padding: spacing[1] },
  toggleBtn:   { flex: 1, alignItems: 'center', paddingVertical: spacing[2.5], borderRadius: radius.lg },
  meterRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  verifyBtn:   { marginBottom: 0, minWidth: 80 },
  customerCard: { borderRadius: radius.lg, padding: spacing[3], gap: spacing[1] },
  quickRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  quickBtn:    { flexBasis: '30%' },
});