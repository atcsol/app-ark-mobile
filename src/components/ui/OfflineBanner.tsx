import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet, View } from 'react-native';

interface OfflineBannerProps {
  isConnected: boolean;
}

export function OfflineBanner({ isConnected }: OfflineBannerProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isConnected) {
      setShowOverlay(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (showOverlay) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowOverlay(false));
    }
  }, [isConnected, opacity, showOverlay]);

  if (!showOverlay) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.card}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>Sem conexao</Text>
        <Text style={styles.subtitle}>
          Verifique sua conexao com a internet e tente novamente
        </Text>
        <View style={styles.dot}>
          <Animated.View style={[styles.pulse]} />
        </View>
        <Text style={styles.hint}>Reconectando automaticamente...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  icon: {
    fontSize: 56,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    marginTop: 24,
  },
  hint: {
    fontSize: 13,
    color: '#999999',
    marginTop: 12,
  },
});
