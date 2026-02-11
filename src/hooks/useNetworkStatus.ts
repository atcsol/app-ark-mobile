import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const lastKnown = useRef(true);

  const verifyConnection = useCallback(async (netInfoConnected: boolean | null) => {
    // If NetInfo says connected, trust it
    if (netInfoConnected === true) {
      lastKnown.current = true;
      setIsConnected(true);
      return;
    }

    // If NetInfo says disconnected or null, verify with a real request
    const reallyConnected = await checkRealConnectivity();
    lastKnown.current = reallyConnected;
    setIsConnected(reallyConnected);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      verifyConnection(state.isConnected);
    });

    return () => unsubscribe();
  }, [verifyConnection]);

  return { isConnected };
}
