import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

function BackButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <Text style={{ fontSize: 16, color: colors.textPrimary }}>‹ Voltar</Text>
    </TouchableOpacity>
  );
}

export default function MechanicEditLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen
        name="[uuid]"
        options={{
          title: 'Editar Mecanico',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
