import { create } from 'zustand';
import { Dimensions, Platform } from 'react-native';

interface UIState {
  isIPad: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  columns: number;
  sidebarVisible: boolean;

  updateDimensions: (width: number, height: number) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
}

const getColumns = (isIPad: boolean, isLandscape: boolean): number => {
  if (!isIPad) return 1;
  return isLandscape ? 3 : 2;
};

const { width, height } = Dimensions.get('window');
const isIPad = Platform.OS === 'ios' && Platform.isPad;
const isLandscape = width > height;

export const useUIStore = create<UIState>((set, get) => ({
  isIPad,
  isLandscape,
  screenWidth: width,
  screenHeight: height,
  columns: getColumns(isIPad, isLandscape),
  sidebarVisible: isIPad,

  updateDimensions: (width: number, height: number) => {
    const isLandscape = width > height;
    set({
      screenWidth: width,
      screenHeight: height,
      isLandscape,
      columns: getColumns(get().isIPad, isLandscape),
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarVisible: (visible: boolean) => set({ sidebarVisible: visible }),
}));
