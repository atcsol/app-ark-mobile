import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { useAdaptiveLayout } from '@/hooks';
import { spacing, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

const MENU_SECTIONS = [
  {
    title: 'Gestao',
    items: [
      { icon: '🚗', label: 'Veiculos', route: '/(admin)/vehicles' },
      { icon: '💰', label: 'Investidores', route: '/(admin)/investors' },
      { icon: '🤝', label: 'Vendedores', route: '/(admin)/sellers' },
      { icon: '🔧', label: 'Mecanicos', route: '/(admin)/mechanics' },
    ],
  },
  {
    title: 'Operacoes',
    items: [
      { icon: '⚙️', label: 'Servicos', route: '/(admin)/services' },
      { icon: '🔩', label: 'Pecas e Estoque', route: '/(admin)/parts' },
      { icon: '✅', label: 'Aprovacoes', route: '/(admin)/approvals' },
    ],
  },
  {
    title: 'Relatorios e Sistema',
    items: [
      { icon: '📈', label: 'Relatorios', route: '/(admin)/reports' },
      { icon: '👥', label: 'Usuarios', route: '/(admin)/users' },
      { icon: '⚙️', label: 'Configuracoes', route: '/(admin)/settings' },
    ],
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const styles = useThemeStyles(createStyles);
  const { listContentStyle } = useAdaptiveLayout();

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: listContentStyle.paddingHorizontal }}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...body.sm,
    color: colors.textTertiary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: spacing.md,
    width: 30,
    textAlign: 'center' as const,
  },
  menuLabel: {
    ...body.md,
    color: colors.textPrimary,
    flex: 1,
  },
  menuArrow: {
    fontSize: 22,
    color: colors.textTertiary,
    fontWeight: '300' as const,
  },
});
