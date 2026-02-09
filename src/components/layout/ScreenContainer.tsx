import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { AdaptiveContainer } from './AdaptiveContainer';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: any;
  padded?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = true,
  refreshing,
  onRefresh,
  style,
  padded = true,
}: Props) {
  const styles = useThemeStyles(createStyles);

  const content = padded ? (
    <AdaptiveContainer style={style}>{children}</AdaptiveContainer>
  ) : (
    <View style={[staticStyles.inner, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={staticStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView
            style={staticStyles.flex}
            contentContainerStyle={staticStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
              ) : undefined
            }
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => ({
  safe: { flex: 1 as const, backgroundColor: colors.background },
});

const staticStyles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
