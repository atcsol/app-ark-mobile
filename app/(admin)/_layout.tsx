import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { spacing, body, heading, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

const MENU_SCREENS = [
  { name: 'dashboard', title: 'Dashboard', icon: '📊' },
  { name: 'vehicles', title: 'Veiculos', icon: '🚗', isDir: true },
  { name: 'investors', title: 'Investidores', icon: '💰', isDir: true },
  { name: 'sellers', title: 'Vendedores', icon: '🤝', isDir: true },
  { name: 'mechanics', title: 'Mecanicos', icon: '🔧', isDir: true },
  { name: 'services', title: 'Servicos', icon: '⚙️', isDir: true },
  { name: 'parts', title: 'Pecas', icon: '🔩', isDir: true },
  { name: 'approvals', title: 'Aprovacoes', icon: '✅', isDir: true },
  { name: 'categories', title: 'Categorias', icon: '🏷️', isDir: true },
  { name: 'brands', title: 'Marcas', icon: '🏭', isDir: true },
  { name: 'reports', title: 'Relatorios', icon: '📈', isDir: true },
  { name: 'users', title: 'Usuarios', icon: '👥', isDir: true },
  { name: 'roles', title: 'Roles', icon: '🛡️' },
];

const FOOTER_SCREENS = ['settings', 'profile'];
const HIDDEN_SCREENS = ['menu'];

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
      </View>

      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
        <DrawerItemList {...props} />
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/(admin)/settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.footerIcon}>⚙️</Text>
          <Text style={styles.footerLabel}>Config</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/(admin)/profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.footerIcon}>👤</Text>
          <Text style={styles.footerLabel}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.footerIcon}>🚪</Text>
          <Text style={[styles.footerLabel, { color: colors.error }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AdminLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerStatusBarHeight: insets.top,
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '600' },
        headerLeftContainerStyle: { paddingLeft: 0 },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: colors.accent + '15',
        drawerLabelStyle: { ...body.md, marginLeft: -8 },
        drawerStyle: { width: 250, backgroundColor: colors.card },
      }}
    >
      {MENU_SCREENS.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            headerShown: !item.isDir,
            drawerIcon: () => <Text style={{ fontSize: 20 }}>{item.icon}</Text>,
          }}
        />
      ))}
      {FOOTER_SCREENS.map((name) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: true,
            title: name === 'settings' ? 'Configuracoes' : 'Perfil',
          }}
        />
      ))}
      {HIDDEN_SCREENS.map((name) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{ drawerItemStyle: { display: 'none' }, headerShown: false }}
        />
      ))}
    </Drawer>
  );
}

const createStyles = (colors: Colors) => ({
  drawerContainer: {
    flex: 1 as const,
    backgroundColor: colors.card,
  },
  drawerHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  userName: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  userEmail: {
    ...body.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  drawerScroll: {
    flex: 1 as const,
  },
  footerBar: {
    flexDirection: 'row' as const,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  footerItem: {
    flex: 1 as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.xs,
  },
  footerIcon: {
    fontSize: 22,
  },
  footerLabel: {
    ...caption.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
