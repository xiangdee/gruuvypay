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
import { DATA_PROVIDERS } from '@/config/bills.config';

export default function DataScreen() {
  const { theme }   = useTheme();
  const [provider, setProvider] = useState('mtn-data');

  const {
    step, billersCode, setBillersCode,
    amount, variationCode, variationName,
    phone, variations, formError,
    loading, pinError, pinRef, result,
    loadVariations, proceedToConfirm, proceedToPin,
    onPinComplete, selectVariation, goBack, payAnother, goHome,
  } = useBillPayment({ serviceID: provider });

  // Load bundles when provider changes
  useEffect(() => { loadVariations(); }, [provider]);

  const selectedProvider = DATA_PROVIDERS.find((p) => p.id === provider);

  if (step === 'confirm') {
    return (
      <BillScreen title="Confirm Data" onBack={goBack}>
        <ConfirmSummary
          rows={[
            { label: 'Network',  value: selectedProvider?.name ?? provider },
            { label: 'Bundle',   value: variationName },
            { label: 'Phone',    value: billersCode },
            { label: 'Amount',   value: `₦${parseFloat(amount).toLocaleString()}`, highlight: true },
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
          title="Data Activated!"
          subtitle={`${variationName} sent to ${billersCode}`}
          reference={result.reference}
          onPayAnother={payAnother}
          onGoHome={goHome}
        />
      </BillScreen>
    );
  }

  return (
    <BillScreen title="Buy Data" onBack={goBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Network selection */}
        <ProviderGrid
          providers={DATA_PROVIDERS}
          selected={provider}
          onSelect={(id) => { setProvider(id); }}
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
        </View>

        {/* Bundle selection */}
        <VariationList
          variations={variations}
          selected={variationCode}
          onSelect={selectVariation}
          loading={loading}
        />

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
  form:  { paddingHorizontal: spacing[4], gap: spacing[4] },
  error: { marginBottom: spacing[2] },
  cta:   { padding: spacing[4] },
});