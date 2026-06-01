// src/hooks/useBeneficiaries.ts
import { useEffect, useState, useCallback } from 'react';
import { walletApi, Beneficiary } from '@/api/wallet.api';
import { recentCache } from '@/services/recentCache';
import { eventBus, EVENTS } from '@/services/eventBus';

export function useBeneficiaries(type?: string) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    // Serve stale cache immediately
    const cached = await recentCache.getCachedBeneficiaries(type);
    if (cached.length) setBeneficiaries(cached as Beneficiary[]);

    // Then fetch fresh from server
    try {
      setLoading(true);
      const fresh = await walletApi.getBeneficiaries(type);
      setBeneficiaries(fresh);
      await recentCache.setCachedBeneficiaries(fresh, type);
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetch();
    const unsub = eventBus.on(EVENTS.BENEFICIARIES_UPDATED, fetch);
    return unsub;
  }, [fetch]);

  const add = useCallback(async (payload: { type: string; label: string; details: Record<string, any> }): Promise<boolean> => {
    try {
      await walletApi.addBeneficiary(payload);
      eventBus.emit(EVENTS.BENEFICIARIES_UPDATED);
      return true;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await walletApi.deleteBeneficiary(id);
    eventBus.emit(EVENTS.BENEFICIARIES_UPDATED);
  }, []);

  return { beneficiaries, loading, refetch: fetch, add, remove };
}
