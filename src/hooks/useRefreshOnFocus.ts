import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus(refetch: () => void) {
  const isFirstRender = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
