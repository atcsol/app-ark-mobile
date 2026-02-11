import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { API_BASE_URL } from '@/utils/constants';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const checking = useRef(false);

  useEffect(() => {
    async function checkConnection() {
      if (checking.current) return;
      checking.current = true;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setIsConnected(true);
      } catch {
        // Only mark offline if we get a network error, not HTTP errors
        setIsConnected(false);
      } finally {
        checking.current = false;
      }
    }

    // Check on mount (with delay to avoid false positive)
    const initialDelay = setTimeout(checkConnection, 5000);

    // Check every 10 seconds
    const interval = setInterval(checkConnection, 10000);

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkConnection();
      }
    });

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return { isConnected };
}
