// The blue top section from screenshots:
// NGN pill, balance with eye toggle, currency flag

import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';
import { useBalanceCardLogic } from './BalanceCard.logic';


interface BalanceCardProps {
  balance:    string | null;
  visible:    boolean;
  loading:    boolean;
  onToggle:   () => void;
  username:   string;
  greeting:   string;
  onRewards?: () => void;
  onChat?:    () => void;
}

const NGN_FLAG = '🇳🇬';

export function BalanceCard({
  balance, visible, loading,
  onToggle, username, greeting,
  onRewards, onChat,
}: BalanceCardProps) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const { fadeAnim, animateToggle } = useBalanceCardLogic(visible);

  useEffect(() => {
    animateToggle(visible);
  }, [visible]);

  const displayBalance = visible
    ? (balance ?? '₦0.00')
    : '••••••';

  // Avatar initials
  const initials = username?.replace('@', '').slice(0, 1).toUpperCase() ?? 'G';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.brand.primary,
        paddingTop: insets.top + spacing[4],
      },
    ]}>

      {/* Top row — avatar, greeting, chat, rewards */}
      <View style={styles.topRow}>
        <View style={styles.userRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: palette.white }]}>
            <Text style={[textStyles.label, { color: theme.brand.primary }]}>
              {initials}
            </Text>
          </View>
          <Text style={[textStyles.bodyLg, { color: palette.white }]}>
            Hi, {username?.replace('@', '')}!
          </Text>
        </View>

        <View style={styles.topActions}>
          {/* Chat */}
          <TouchableOpacity
            onPress={onChat}
            style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          >
            <Ionicons name="chatbubble-outline" size={18} color={palette.white} />
          </TouchableOpacity>

          {/* Rewards */}
          <TouchableOpacity
            onPress={onRewards}
            style={[styles.rewardsBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          >
            <Ionicons name="gift-outline" size={16} color={palette.white} />
            <Text style={[textStyles.labelSm, { color: palette.white }]}>
              Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency selector pill */}
      <View style={styles.currencyRow}>
        <TouchableOpacity
          style={[styles.currencyPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
        >
          <Text style={{ fontSize: 16 }}>{NGN_FLAG}</Text>
          <Text style={[textStyles.label, { color: palette.white }]}>NGN</Text>
          <Ionicons name="chevron-down" size={14} color={palette.white} />
        </TouchableOpacity>
      </View>

      {/* Balance */}
      <View style={styles.balanceRow}>
        {loading && !balance
          ? (
            <View style={styles.balanceSkeleton} />
          )
          : (
            <Animated.Text
              style={[
                styles.balanceText,
                { color: palette.white, opacity: 1 },
              ]}
            >
              {displayBalance}
            </Animated.Text>
          )
        }

        {/* Eye toggle */}
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom curve */}
      <View style={styles.curve} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingBottom:     spacing[8],
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[4],
  },
  userRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  avatar: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  iconBtn: {
    width:          36,
    height:         36,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  rewardsBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:     radius['3xl'],
  },
  currencyRow: {
    alignItems:    'center',
    marginBottom:  spacing[2],
  },
  currencyPill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing[1.5],
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[1.5],
    borderRadius:     radius['3xl'],
  },
  balanceRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[3],
    marginBottom:   spacing[2],
  },
  balanceText: {
    fontSize:      40,
    fontWeight:    '800',
    letterSpacing: -1,
  },
  balanceSkeleton: {
    width:        180,
    height:       44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  eyeBtn: {
    padding: spacing[1],
  },
  curve: {
    position:       'absolute',
    bottom:         -24,
    left:           0,
    right:          0,
    height:         48,
    backgroundColor: 'inherit',
  },
});