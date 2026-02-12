import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';

export default function VehiclesLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes do Veículo', headerBackTitle: 'Voltar' }} />
    </Stack>
  );
}
