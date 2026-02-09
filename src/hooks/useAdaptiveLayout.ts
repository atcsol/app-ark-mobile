import { useDeviceType } from './useDeviceType';

export function useAdaptiveLayout() {
  const { isIPad, isLandscape, screenWidth } = useDeviceType();

  const contentMaxWidth = isIPad ? 900 : screenWidth;

  const padding = isIPad ? 24 : 16;
  const paddingHorizontal = isIPad ? (isLandscape ? 48 : 32) : 16;

  const fontSize = {
    h1: isIPad ? 32 : 28,
    h2: isIPad ? 28 : 24,
    h3: isIPad ? 24 : 20,
    h4: isIPad ? 20 : 16,
    body: isIPad ? 16 : 14,
    small: isIPad ? 14 : 12,
    caption: isIPad ? 12 : 10,
  };

  const cardWidth = isIPad
    ? isLandscape
      ? (contentMaxWidth - padding * 4) / 3
      : (contentMaxWidth - padding * 3) / 2
    : screenWidth - padding * 2;

  return {
    contentMaxWidth,
    padding,
    paddingHorizontal,
    fontSize,
    cardWidth,
    isIPad,
    isLandscape,
  };
}
