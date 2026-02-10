import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineBannerProps {
  isConnected: boolean;
}

export function OfflineBanner({ isConnected }: OfflineBannerProps) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isConnected ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], paddingTop: insets.top },
      ]}
      pointerEvents={isConnected ? 'none' : 'auto'}
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
