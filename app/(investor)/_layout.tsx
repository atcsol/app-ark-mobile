import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

const TAB_ITEMS = [
  { name: 'dashboard', title: 'Dashboard', icon: '📊' },
  { name: 'vehicles', title: 'Veículos', icon: '🚗' },
  { name: 'notifications', title: 'Notificações', icon: '🔔' },
  { name: 'profile', title: 'Perfil', icon: '👤' },
];

export default function InvestorLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
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
