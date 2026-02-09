import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useUIStore } from '@/stores/uiStore';

export function useDeviceType() {
  const { isIPad, isLandscape, screenWidth, screenHeight, columns, updateDimensions } =
    useUIStore();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      updateDimensions(window.width, window.height);
    });
    return () => subscription.remove();
  }, [updateDimensions]);

  return {
    isIPad,
    isIPhone: !isIPad,
    isLandscape,
    isPortrait: !isLandscape,
    screenWidth,
    screenHeight,
    columns,
  };
}
