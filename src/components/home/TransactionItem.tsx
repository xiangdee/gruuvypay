import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface TransactionItemProps {
  type:      'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE';
  amount:    string;
  narration: string | null;
  status:    'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  createdAt: string;
  metadata?: any;
}

const TYPE_CONFIG = {
  DEPOSIT:    { icon: 'arrow-down-outline'  as const, label: 'Received',  colorKey: 'success' },
  WITHDRAWAL: { icon: 'arrow-up-outline'    as const, label: 'Sent',      colorKey: 'error'   },
  TRANSFER:   { icon: 'swap-horizontal-outline' as const, label: 'Transfer', colorKey: 'info' },
  FEE:        { icon: 'receipt-outline'     as const, label: 'Fee',       colorKey: 'warning' },
} as const;

export function TransactionItem({
  type, amount, narration, status, createdAt, metadata,
}: TransactionItemProps) {
  const { theme } = useTheme();
  const config    = TYPE_CONFIG[type];

  const isDebit  = type === 'WITHDRAWAL' || (type === 'TRANSFER' && metadata?.direction === 'debit');
  const amtColor = isDebit ? theme.status.error : theme.status.success;
  const amtPrefix = isDebit ? '-' : '+';

  const statusColor = {
    SUCCESS:  theme.status.success,
    PENDING:  theme.status.warning,
    FAILED:   theme.status.error,
    REVERSED: theme.status.warning,
  }[status];

  const formattedDate = new Date(createdAt).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.row}>
      {/* Icon */}
      <View style={[
        styles.iconWrap,
        { backgroundColor: theme.bg.card },
      ]}>
        <Ionicons
          name={config.icon}
          size={20}
          color={theme.status[config.colorKey as keyof typeof theme.status]}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={[textStyles.label, { color: theme.text.primary }]} numberOfLines={1}>
          {narration ?? config.label}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            {formattedDate}
          </Text>
          {status !== 'SUCCESS' && (
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[textStyles.labelSm, { color: statusColor, fontSize: 9 }]}>
                {status}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount */}
      <Text style={[textStyles.label, { color: amtColor }]}>
        {amtPrefix}{amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    paddingVertical: spacing[3],
  },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap:  2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  badge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical:   2,
    borderRadius:      radius.full,
  },
});