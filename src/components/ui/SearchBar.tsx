import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  debounceMs = 500,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChangeText(text), debounceMs);
    },
    [onChangeText, debounceMs],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChangeText('');
  }, [onChangeText]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        returnKeyType="search"
        autoCorrect={false}
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={staticStyles.clearBtn}>
          <View style={staticStyles.clearIcon}>
            <View style={[styles.clearLine, staticStyles.clearLineLeft]} />
            <View style={[styles.clearLine, staticStyles.clearLineRight]} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: {
    flex: 1,
    ...body.md,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearLine: {
    position: 'absolute' as const,
    width: 14,
    height: 2,
    backgroundColor: colors.textTertiary,
    borderRadius: 1,
  },
});

const staticStyles = StyleSheet.create({
  clearBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  clearIcon: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearLineLeft: {
    transform: [{ rotate: '45deg' }],
  },
  clearLineRight: {
    transform: [{ rotate: '-45deg' }],
  },
});
