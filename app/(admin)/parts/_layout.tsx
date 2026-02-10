import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function PartsLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Pecas',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes da Peca' }} />
      <Stack.Screen name="create" options={{ title: 'Nova Peca' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
