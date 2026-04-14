// app/(app)/bills/cable.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Input }    from '@/components/ui/Input';
import { Button }   from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import {
  BillScreen, ProviderGrid, VariationList,
  ConfirmSummary, BillPinStep, BillSuccess,
} from '@/components/bills/BillScreenLayout';
import { useTheme, spacing } from '@/theme';
import { useBillPayment } from '@/screens/app/bills/useBillPayment';
import { CABLE_PROVIDERS } from '@/config/bills.config';

export default function CableScreen() {
  const { theme }  = useTheme();
  const [provider, setProvider] = useState('dstv');

  const {
    step, billersCode, setBillersCode,
    amount, variationCode, variationName,
    customerInfo, variations, formError,
    loading, verifying, pinError, pinRef, result,
    loadVariations, verifyCustomer, proceedToConfirm,
    proceedToPin, onPinComplete, selectVariation,
    goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: provider });

  useEffect(() => { loadVariations(); }, [provider]);

  const selectedProvider = CABLE_PROVIDERS.find((p) => p.id === provider);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Subscription" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'Provider',   value: selectedProvider?.name ?? provider },
            { label: 'Smartcard',  value: billersCode },
            { label: 'Customer',   value: customerInfo?.Customer_Name ?? '—' },
            { label: 'Plan',       value: variationName },
            { label: 'Amount',     value: `₦${parseFloat(amount).toLocaleString()}`, highlight: true },
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
          title="Subscription Renewed!"
          subtitle={`${variationName} activated for ${customerInfo?.Customer_Name ?? billersCode}`}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Cable TV" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Provider selection */}
        <ProviderGrid
          providers={CABLE_PROVIDERS}
          selected={provider}
          onSelect={(id) => { setProvider(id); }}
        />

        <View style={styles.form}>
          {formError ? <ErrorCard message={formError} /> : null}

          {/* Smartcard number + verify */}
          <View style={styles.smartcardRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Smartcard / IUC Number"
                placeholder="Enter smartcard number"
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
        </View>

        {/* Plan selection — show after billing code is entered */}
        {billersCode.length >= 10 && (
          <VariationList
            variations={variations}
            selected={variationCode}
            onSelect={selectVariation}
            loading={loading && !variations.length}
          />
        )}

        {variationCode && (
          <View style={styles.cta}>
            <Button
              label="Continue"
              onPress={proceedToConfirm}
              disabled={!billersCode || !variationCode}
            />
          </View>
        )}
      </ScrollView>
    </BillScreen>
  );
}

const styles = StyleSheet.create({
  form:         { paddingHorizontal: spacing[4], gap: spacing[4] },
  smartcardRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  verifyBtn:    { marginBottom: 0, minWidth: 80 },
  cta:          { padding: spacing[4] },
});