import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useHeaderOptions } from '@/hooks';

const TAB_ITEMS = [
  { name: 'dashboard', title: 'Dashboard', icon: '📊' },
  { name: 'vehicles', title: 'Veículos', icon: '🚗' },
  { name: 'sales', title: 'Vendas', icon: '💰' },
  { name: 'profile', title: 'Perfil', icon: '👤' },
];

export default function SellerLayout() {
  const { colors } = useTheme();
  const headerOptions = useHeaderOptions();

  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        headerShown: true,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '600' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { borderTopColor: colors.divider, backgroundColor: colors.card },
      }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: () => (
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
