import { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider } from '@ant-design/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { ThemeProvider, useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { OfflineBanner } from '@/components/ui';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import '../global.css';

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isHydrated, segments, router]);
}

function AppContent() {
  const { antdTheme, isDark } = useTheme();
  const { isConnected } = useNetworkStatus();

  useProtectedRoute();

  // Initialize push notifications
  usePushNotifications();

  return (
    <Provider theme={antdTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(mechanic)" />
        <Stack.Screen name="(investor)" />
      </Stack>
      <OfflineBanner isConnected={isConnected} />
    </Provider>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load icon fonts
  useEffect(() => {
    Font.loadAsync({
      antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    }).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  // Hide the native splash once hydrated and fonts loaded
  useEffect(() => {
    if (isHydrated && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, fontsLoaded]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
          {showSplash && <AnimatedSplash onAnimationComplete={handleSplashComplete} />}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
