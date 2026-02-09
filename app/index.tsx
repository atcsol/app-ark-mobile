import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/ui';

export default function Index() {
  const { isHydrated, isAuthenticated, userType } = useAuthStore();

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !userType) {
    return <Redirect href="/auth/login" />;
  }

  switch (userType) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'seller':
      return <Redirect href="/(seller)/dashboard" />;
    case 'mechanic':
      return <Redirect href="/(mechanic)/dashboard" />;
    case 'investor':
      return <Redirect href="/(investor)/dashboard" />;
    default:
      return <Redirect href="/auth/login" />;
  }
}
