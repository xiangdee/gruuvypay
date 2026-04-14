// src/screens/app/useProfile.tsx

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { useRouter } from 'expo-router';
import { useToast } from '@/hooks/useToast';
import { Alert } from 'react-native';

export function useProfile() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const toast    = useToast();

  const user = useAppSelector((s) => s.auth.user);

  const tierLabels: Record<string, { label: string; color: string }> = {
    TIER_0: { label: 'Phone Verified',     color: '#F59E0B' },
    TIER_1: { label: 'BVN Verified',       color: '#10B981' },
    TIER_2: { label: 'NIN + Utility Bill', color: '#6366F1' },
    TIER_3: { label: 'Address Verified',   color: '#1B4FD8' },
  };

  const tierInfo = tierLabels[user?.tier ?? 'TIER_0'];

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            router.replace('/(auth)');
          },
        },
      ],
    );
  }

  const navItems = [
    {
      section: 'Account',
      items: [
        { id: 'security',  label: 'Security',        icon: 'shield-checkmark-outline', route: '/(app)/profile/security'   },
        { id: 'limits',    label: 'Account Limits',  icon: 'bar-chart-outline',        route: '/(app)/profile/limits'     },
        { id: 'kyc',       label: 'Upgrade Account', icon: 'ribbon-outline',           route: '/(app)/kyc'                },
        { id: 'sessions',  label: 'Active Sessions', icon: 'phone-portrait-outline',   route: '/(app)/profile/sessions'   },
      ],
    },
    {
      section: 'Preferences',
      items: [
        { id: 'appearance',  label: 'Appearance',      icon: 'color-palette-outline',    route: '/(app)/profile/appearance' },
        { id: 'notifs',      label: 'Notifications',   icon: 'notifications-outline',    route: '/(app)/profile/notifications' },
      ],
    },
    {
      section: 'Support',
      items: [
        { id: 'help',        label: 'Get Help',        icon: 'help-circle-outline',      route: '/(app)/profile/help'       },
        { id: 'legal',       label: 'Legal & Info',    icon: 'document-text-outline',    route: '/(app)/profile/legal'      },
      ],
    },
  ];

  function navigate(route: string) {
    router.push(route as any);
  }

  return {
    user,
    tierInfo,
    navItems,
    navigate,
    handleLogout,
  };
}