import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { adminApi } from '@/services/adminApi';
import { sellerApi } from '@/services/sellerApi';
import { mechanicApi } from '@/services/mechanicApi';
import { investorApi } from '@/services/investorApi';

export function useApi() {
  const userType = useAuthStore((s) => s.userType);

  const api = useMemo(() => {
    switch (userType) {
      case 'admin':
        return adminApi;
      case 'seller':
        return sellerApi;
      case 'mechanic':
        return mechanicApi;
      case 'investor':
        return investorApi;
      default:
        return null;
    }
  }, [userType]);

  return { api, userType };
}
