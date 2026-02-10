import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const confirmedOnce = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // On first event, only accept "connected" to avoid false offline banner
      // After first confirmed connection, start tracking disconnections
      if (!confirmedOnce.current) {
        if (state.isConnected === true) {
          confirmedOnce.current = true;
        }
        // Don't show offline until we've seen at least one connected state
        return;
      }

      // After initial connection confirmed, track real changes
      // Only mark offline when isConnected is explicitly false
      setIsConnected(state.isConnected !== false);
    });

    // Also do a manual fetch to initialize
    NetInfo.fetch().then((state) => {
      if (state.isConnected === true) {
        confirmedOnce.current = true;
      }
      setIsConnected(state.isConnected !== false);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
