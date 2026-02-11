import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineBannerProps {
  isConnected: boolean;
}

export function OfflineBanner({ isConnected }: OfflineBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isConnected) {
      setShowBanner(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (showBanner) {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowBanner(false));
    }
  }, [isConnected, translateY, showBanner]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], paddingTop: insets.top },
      ]}
    >
      <Text style={styles.text}>Sem conexao com a internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingTop: 4,
  },
});
