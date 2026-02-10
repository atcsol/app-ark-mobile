import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Only mark as disconnected when both checks explicitly say false
      // This avoids false negatives on simulators and initial null states
      const connected = state.isConnected === false && state.isInternetReachable === false
        ? false
        : true;
      setIsConnected(connected);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected };
}
