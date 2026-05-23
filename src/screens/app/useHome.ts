// Home = wallet + bills + FULL transaction history (paginated)
// No separate transactions tab

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchBalance,
  fetchTransactions,
  fetchVirtualAccount,
  toggleBalanceVisibility,
} from '@/store/slices/wallet.slice';

export function useHomeLogic() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const user   = useAppSelector((s) => s.auth.user);
  const wallet = useAppSelector((s) => s.wallet);

  // Initial load
  useEffect(() => {
    dispatch(fetchBalance());
    setInterval(() => dispatch(fetchBalance()), 30000);
    dispatch(fetchTransactions({ page: 1 }));
    dispatch(fetchVirtualAccount());
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchBalance()),
      dispatch(fetchTransactions({ page: 1 })),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Load more transactions (infinite scroll)
  function loadMoreTransactions() {
    if (wallet.txLoading) return;
    const nextPage = wallet.txPage + 1;
    const totalPages = Math.ceil(wallet.txTotal / 20);
    if (nextPage > totalPages) return;
    dispatch(fetchTransactions({ page: nextPage }));
  }

  function handleToggleBalance() {
    dispatch(toggleBalanceVisibility());
  }

  // Action handlers
  function handleTransfer()        { router.push('/(app)/send');                   }
  function handleTopUp()           { router.push('/(app)/top-up');                 }
  function handleConvert()         { router.push('/(app)/convert');                }
  function handleAnalytics()       { router.push('/(app)/analytics');              }
  function handleRewards()         { router.push('/(app)/rewards');                }
  function handleGetHelp()         { router.push('/(app)/profile/help');                   }
  function handleAirtime()         { router.push('/(app)/bills/airtime');          }
  function handleData()            { router.push('/(app)/bills/data');             }
  function handleElectricity()     { router.push('/(app)/bills/electricity');      }
  function handleCable()           { router.push('/(app)/bills/cable');            }
  function handleBetting()         { router.push('/(app)/bills/betting');          }
  function handleAirtimeToCash()   { router.push('/(app)/bills/airtime-to-cash'); }
  function handleViewAllBills()    { router.push('/(app)/bills');                  }
  function handleTransactionPress(txId: string) {
    router.push({ pathname: '/(app)/transaction/[id]', params: { id: txId } });
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return {
    user,
    wallet,
    refreshing,
    onRefresh,
    loadMoreTransactions,
    handleToggleBalance,
    handleTransfer,
    handleTopUp,
    handleConvert,
    handleAnalytics,
    handleRewards,
    handleGetHelp,
    handleAirtime,
    handleData,
    handleElectricity,
    handleCable,
    handleBetting,
    handleAirtimeToCash,
    handleViewAllBills,
    handleTransactionPress,
    greeting: getGreeting(),
  };
}