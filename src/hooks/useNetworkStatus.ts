import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const hasBeenConnected = useRef(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Ignore all events in the first 10 seconds to avoid false positives
      if (Date.now() - startTime.current < 10000) {
        if (state.isConnected === true) {
          hasBeenConnected.current = true;
        }
        return;
      }

      if (state.isConnected === true) {
        hasBeenConnected.current = true;
        setIsConnected(true);
      } else if (hasBeenConnected.current && state.isConnected === false) {
        // Only show offline if we previously had a confirmed connection
        setIsConnected(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
