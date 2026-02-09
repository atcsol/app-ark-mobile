import React from 'react';
import { View } from 'react-native';
import { useDeviceType } from '@/hooks';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  master: React.ReactNode;
  detail: React.ReactNode;
  masterWidth?: number;
}

export function SplitView({ master, detail, masterWidth = 380 }: Props) {
  const { isIPad, isLandscape } = useDeviceType();
  const styles = useThemeStyles(createStyles);

  if (!isIPad || !isLandscape) {
    return <View style={styles.full}>{master}</View>;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.master, { width: masterWidth }]}>{master}</View>
      <View style={styles.divider} />
      <View style={styles.detail}>{detail}</View>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: { flex: 1 as const, flexDirection: 'row' as const },
  full: { flex: 1 as const },
  master: { borderRightWidth: 1, borderRightColor: colors.divider },
  divider: { width: 1, backgroundColor: colors.divider },
  detail: { flex: 1 as const },
});
