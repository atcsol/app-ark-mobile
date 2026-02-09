import { Platform, Dimensions } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isIPad = Platform.OS === 'ios' && Platform.isPad;
export const isIPhone = Platform.OS === 'ios' && !Platform.isPad;

export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height, isLandscape: width > height };
};

export const getColumns = (isIPad: boolean, isLandscape: boolean): number => {
  if (!isIPad) return 1;
  return isLandscape ? 3 : 2;
};
