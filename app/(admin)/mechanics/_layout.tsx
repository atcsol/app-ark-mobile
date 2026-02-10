import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function MechanicsLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Mecanicos',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes do Mecanico' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Mecanico' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
